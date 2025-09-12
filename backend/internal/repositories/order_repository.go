package repositories

import (
	"context"
	"time"

	"shop/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OrderListParams struct {
	TenantID   string
	Page       int64
	Limit      int64
	Search     string
	StatusID   string
	SupplierID string
	ShopID     string
	Type       string
	SortBy     string
	SortOrder  int
	DateFrom   *time.Time
	DateTo     *time.Time
}

type OrderRepository struct { col *mongo.Collection }

func NewOrderRepository(db *mongo.Database) *OrderRepository { return &OrderRepository{ col: db.Collection("orders") } }

func (r *OrderRepository) List(ctx context.Context, p OrderListParams) ([]models.Order, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"items.product_name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"items.product_sku": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.StatusID != "" { filter["status_id"] = p.StatusID }
	if p.SupplierID != "" { filter["supplier_id"] = p.SupplierID }
	if p.ShopID != "" { filter["shop_id"] = p.ShopID }
	if p.Type != "" { filter["type"] = p.Type }
	if p.DateFrom != nil || p.DateTo != nil {
		dt := bson.M{}
		if p.DateFrom != nil { dt["$gte"] = *p.DateFrom }
		if p.DateTo != nil { dt["$lte"] = *p.DateTo }
		filter["created_at"] = dt
	}
	// sort
	sortKey := "created_at"
	if p.SortBy != "" { sortKey = p.SortBy }
	order := -1
	if p.SortOrder != 0 { order = p.SortOrder }
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(bson.D{{Key: sortKey, Value: order}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Order
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *OrderRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Order, error) {
	var m models.Order
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *OrderRepository) Create(ctx context.Context, m *models.Order) (*models.Order, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if m.Payments == nil { m.Payments = []models.OrderPayment{} }
	if m.Items == nil { m.Items = []models.OrderItem{} }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *OrderRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Order, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *OrderRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}

func (r *OrderRepository) AddPayment(ctx context.Context, id primitive.ObjectID, tenantID string, p models.OrderPayment) (*models.Order, error) {
	p.ID = primitive.NewObjectID()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{
		"$push": bson.M{"payments": p},
		"$inc": bson.M{"total_paid_amount": p.Amount},
		"$set": bson.M{"updated_at": time.Now().UTC()},
	})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

type SupplierStats struct {
	TotalOrders int64      `bson:"total_orders"`
	PaidCount   int64      `bson:"paid_count"`
	UnpaidCount int64      `bson:"unpaid_count"`
	PartialCount int64     `bson:"partial_count"`
	TotalAmount float64    `bson:"total_amount"`
	TotalPaid   float64    `bson:"total_paid"`
	TotalItems  int64      `bson:"total_items"`
	MinCreated  *time.Time `bson:"min_created"`
	MaxCreated  *time.Time `bson:"max_created"`
}

func (r *OrderRepository) SupplierStats(ctx context.Context, tenantID, supplierID, shopID string) (*SupplierStats, error) {
	match := bson.M{"tenant_id": tenantID, "supplier_id": supplierID}
	if shopID != "" { match["shop_id"] = shopID }
	// Compute per-order computed_amount with robust fallbacks when totals are not stored
	lineAmount := bson.M{"$sum": bson.M{"$map": bson.M{
		"input": "$items",
		"as": "it",
		"in": bson.M{"$cond": bson.A{
			bson.M{"$gt": bson.A{"$$it.total_price", 0}},
			"$$it.total_price",
			bson.M{"$multiply": bson.A{"$$it.quantity", bson.M{"$ifNull": bson.A{"$$it.supply_price", bson.M{"$ifNull": bson.A{"$$it.unit_price", 0}}}}}},
		}},
	}}}
	baseAmount := bson.M{"$ifNull": bson.A{"$total_supply_price", bson.M{"$ifNull": bson.A{"$total_price", 0}}}}
	computedAmount := bson.M{"$cond": bson.A{bson.M{"$gt": bson.A{baseAmount, 0}}, baseAmount, lineAmount}}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$project", Value: bson.M{
			"computed_amount": computedAmount,
			"total_paid_amount": 1,
			// items_count fallback: sum of item quantities when items_count is missing
			"items_count": bson.M{"$ifNull": bson.A{"$items_count", bson.M{"$sum": "$items.quantity"}}},
			"created_at": 1,
		}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": nil,
			"total_orders": bson.M{"$sum": 1},
			"paid_count": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$gte": bson.A{"$total_paid_amount", "$computed_amount"}}, 1, 0}}},
			"unpaid_count": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$and": bson.A{bson.M{"$eq": bson.A{"$total_paid_amount", 0}}, bson.M{"$gt": bson.A{"$computed_amount", 0}}}}, 1, 0}}},
			"partial_count": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$and": bson.A{bson.M{"$gt": bson.A{"$total_paid_amount", 0}}, bson.M{"$lt": bson.A{"$total_paid_amount", "$computed_amount"}}}}, 1, 0}}},
			"total_amount": bson.M{"$sum": "$computed_amount"},
			"total_paid": bson.M{"$sum": "$total_paid_amount"},
			"total_items": bson.M{"$sum": "$items_count"},
			"min_created": bson.M{"$min": "$created_at"},
			"max_created": bson.M{"$max": "$created_at"},
		}}},
	}
	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil { return nil, err }
	defer cur.Close(ctx)
	var rows []SupplierStats
	if err := cur.All(ctx, &rows); err != nil { return nil, err }
	if len(rows) == 0 { return &SupplierStats{}, nil }
	return &rows[0], nil
}

type SupplierPayment struct {
	OrderID      string    `bson:"order_id" json:"order_id"`
	Amount       float64   `bson:"amount" json:"amount"`
	PaymentDate  time.Time `bson:"payment_date" json:"payment_date"`
	Method       string    `bson:"payment_method" json:"payment_method"`
	Description  string    `bson:"description" json:"description"`
}

func (r *OrderRepository) PaymentsBySupplier(ctx context.Context, tenantID, supplierID, shopID string, page, limit int64) ([]SupplierPayment, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	match := bson.M{"tenant_id": tenantID, "supplier_id": supplierID}
	if shopID != "" { match["shop_id"] = shopID }
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$unwind", Value: "$payments"}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "payments.payment_date", Value: -1}}}},
		bson.D{{Key: "$facet", Value: bson.M{
			"items": mongo.Pipeline{
				bson.D{{Key: "$skip", Value: (page-1)*limit}},
				bson.D{{Key: "$limit", Value: limit}},
				bson.D{{Key: "$project", Value: bson.M{
					"order_id": bson.M{"$toString": "$_id"},
					"amount": "$payments.amount",
					"payment_date": "$payments.payment_date",
					"payment_method": "$payments.payment_method",
					"description": "$payments.description",
				}}},
			},
			"total": mongo.Pipeline{
				bson.D{{Key: "$count", Value: "count"}},
			},
		}}},
	}
	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var out []struct{ Items []SupplierPayment `bson:"items"`; Total []struct{ Count int64 `bson:"count"` } `bson:"total"` }
	if err := cur.All(ctx, &out); err != nil { return nil, 0, err }
	if len(out) == 0 { return []SupplierPayment{}, 0, nil }
	var total int64
	if len(out[0].Total) > 0 { total = out[0].Total[0].Count }
	return out[0].Items, total, nil
}

// Supplier products aggregated from orders

type SupplierProductRow struct {
	ProductID    string  `bson:"product_id" json:"product_id"`
	Name         string  `bson:"name" json:"name"`
	SKU          string  `bson:"sku" json:"sku"`
	Barcode      string  `bson:"barcode" json:"barcode"`
	CategoryName string  `bson:"category_name" json:"category_name"`
	Image        string  `bson:"image" json:"image"`
	Quantity     int64   `bson:"quantity" json:"quantity"`
	SupplyPrice  float64 `bson:"supply_price" json:"supply_price"`
	RetailPrice  float64 `bson:"retail_price" json:"retail_price"`
}

func (r *OrderRepository) ProductsBySupplier(ctx context.Context, tenantID, supplierID, shopID, search string, page, limit int64) ([]SupplierProductRow, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	match := bson.M{"tenant_id": tenantID, "supplier_id": supplierID}
	if shopID != "" { match["shop_id"] = shopID }
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$unwind", Value: "$items"}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": "$items.product_id",
			"quantity": bson.M{"$sum": "$items.quantity"},
			"supply_price": bson.M{"$last": "$items.supply_price"},
			"retail_price": bson.M{"$last": "$items.retail_price"},
		}}},
		bson.D{{Key: "$lookup", Value: bson.M{
			"from": "products",
			"localField": "_id",
			"foreignField": "_id",
			"as": "prod",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$prod", "preserveNullAndEmptyArrays": true}}},
		bson.D{{Key: "$project", Value: bson.M{
			"product_id": bson.M{"$toString": "$_id"},
			"name": "$prod.name",
			"sku": "$prod.sku",
			"barcode": "$prod.barcode",
			"category_name": "$prod.category_name",
			// Use $ifNull to avoid $size error when images is missing
			"image": bson.M{"$cond": bson.A{
				bson.M{"$gt": bson.A{bson.M{"$size": bson.M{"$ifNull": bson.A{"$prod.images", bson.A{}}}}, 0}},
				bson.M{"$arrayElemAt": bson.A{bson.M{"$ifNull": bson.A{"$prod.images", bson.A{}}}, 0}},
				"",
			}},
			"quantity": 1,
			"supply_price": 1,
			"retail_price": 1,
		}}},
	}
	if search != "" {
		pipeline = append(pipeline, bson.D{{Key: "$match", Value: bson.M{
			"$or": bson.A{
				bson.M{"name": bson.M{"$regex": search, "$options": "i"}},
				bson.M{"sku": bson.M{"$regex": search, "$options": "i"}},
				bson.M{"barcode": bson.M{"$regex": search, "$options": "i"}},
			},
		}}})
	}
	pipeline = append(pipeline,
		bson.D{{Key: "$facet", Value: bson.M{
			"items": mongo.Pipeline{
				bson.D{{Key: "$sort", Value: bson.D{{Key: "name", Value: 1}}}},
				bson.D{{Key: "$skip", Value: (page-1)*limit}},
				bson.D{{Key: "$limit", Value: limit}},
			},
			"total": mongo.Pipeline{
				bson.D{{Key: "$count", Value: "count"}},
			},
		}}},
	)
	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var out []struct{ Items []SupplierProductRow `bson:"items"`; Total []struct{ Count int64 `bson:"count"` } `bson:"total"` }
	if err := cur.All(ctx, &out); err != nil { return nil, 0, err }
	if len(out) == 0 { return []SupplierProductRow{}, 0, nil }
	var total int64
	if len(out[0].Total) > 0 { total = out[0].Total[0].Count }
	return out[0].Items, total, nil
} 