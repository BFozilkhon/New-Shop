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

type ProductListParams struct {
	Page       int64
	Limit      int64
	Sort       bson.D
	Search     string
	CategoryID string
	BrandID    string
	SupplierID string
	Status     string
	IsActive   *bool
	IsBundle   *bool
	MinPrice   *float64
	MaxPrice   *float64
	TenantID   string
    StoreID   string

    LowStock  *bool
    ZeroStock *bool
    Archived  *bool
    IsRealizatsiya *bool
    IsKonsignatsiya *bool
    IsDirtyCore *bool
}

type ProductRepository struct {
	col *mongo.Collection
}

func NewProductRepository(db *mongo.Database) *ProductRepository {
	return &ProductRepository{col: db.Collection("products")}
}

func (r *ProductRepository) List(ctx context.Context, p ProductListParams) ([]models.Product, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit > 200 {
		p.Limit = 20
	}
	if p.Sort == nil {
		p.Sort = bson.D{{Key: "created_at", Value: -1}}
	}

	filter := bson.M{"tenant_id": p.TenantID}
	
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"sku": bson.M{"$regex": p.Search, "$options": "i"}},
			{"description": bson.M{"$regex": p.Search, "$options": "i"}},
			{"barcode": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	
	if p.CategoryID != "" {
		if oid, err := primitive.ObjectIDFromHex(p.CategoryID); err == nil {
			filter["category_id"] = oid
		}
	}
	
	if p.BrandID != "" {
		if oid, err := primitive.ObjectIDFromHex(p.BrandID); err == nil {
			filter["brand_id"] = oid
		}
	}
	
	if p.SupplierID != "" {
		if oid, err := primitive.ObjectIDFromHex(p.SupplierID); err == nil {
			filter["supplier_id"] = oid
		}
	}
	
	if p.Status != "" {
		filter["status"] = p.Status
	}
	
	if p.IsActive != nil {
		filter["is_active"] = *p.IsActive
	}
	
	if p.IsBundle != nil {
		filter["is_bundle"] = *p.IsBundle
	}

    if p.Archived != nil { filter["archived"] = *p.Archived } else { filter["archived"] = bson.M{"$ne": true} }

    if p.IsRealizatsiya != nil { filter["is_realizatsiya"] = *p.IsRealizatsiya }
    if p.IsKonsignatsiya != nil { filter["is_konsignatsiya"] = *p.IsKonsignatsiya }
    if p.IsDirtyCore != nil { filter["is_dirty_core"] = *p.IsDirtyCore }
	
	// Price range filter
	if p.MinPrice != nil || p.MaxPrice != nil {
		priceFilter := bson.M{}
		if p.MinPrice != nil {
			priceFilter["$gte"] = *p.MinPrice
		}
		if p.MaxPrice != nil {
			priceFilter["$lte"] = *p.MaxPrice
		}
		filter["price"] = priceFilter
	}

    if p.StoreID != "" {
        if oid, err := primitive.ObjectIDFromHex(p.StoreID); err == nil {
            filter["store_id"] = oid
        }
    }

    if p.ZeroStock != nil && *p.ZeroStock {
        filter["stock"] = 0
    }
    if p.LowStock != nil && *p.LowStock {
        // stock < min_stock
        filter["$expr"] = bson.M{"$lt": bson.A{"$stock", "$min_stock"}}
    }

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(ctx)

	var items []models.Product
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *ProductRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Product, error) {
	var m models.Product
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ProductRepository) GetByIDHex(ctx context.Context, id string, tenantID string) (*models.Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid, tenantID)
}

func (r *ProductRepository) GetBySKU(ctx context.Context, sku string, tenantID string) (*models.Product, error) {
	var m models.Product
	if err := r.col.FindOne(ctx, bson.M{"sku": sku, "tenant_id": tenantID}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ProductRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Product, error) {
	var m models.Product
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ProductRepository) Create(ctx context.Context, m *models.Product) (*models.Product, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	
	// Set defaults
	if !m.IsActive {
		m.IsActive = true
	}
	if m.Status == "" {
		m.Status = models.ProductStatusActive
	}
	if m.Type == "" {
		m.Type = models.ProductTypeSingle
	}
	if m.Images == nil {
		m.Images = []string{}
	}
	if m.Attributes == nil {
		m.Attributes = []models.ProductAttribute{}
	}
	if m.Variants == nil {
		m.Variants = []models.ProductVariant{}
	}
	if m.Warehouses == nil {
		m.Warehouses = []models.ProductWarehouse{}
	}

	res, err := r.col.InsertOne(ctx, m)
	if err != nil {
		return nil, err
	}
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *ProductRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Product, error) {
	if update == nil {
		update = bson.M{}
	}
	update["updated_at"] = time.Now().UTC()

	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id, tenantID)
}

func (r *ProductRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}

func (r *ProductRepository) UpdateStock(ctx context.Context, id primitive.ObjectID, tenantID string, stock int) error {
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"_id": id, "tenant_id": tenantID},
		bson.M{"$set": bson.M{"stock": stock, "updated_at": time.Now().UTC()}},
	)
	return err
}

func (r *ProductRepository) UpdatePrices(ctx context.Context, id primitive.ObjectID, tenantID string, supply float64, retail float64) error {
	set := bson.M{"updated_at": time.Now().UTC()}
	if supply >= 0 { set["cost_price"] = supply }
	if retail >= 0 { set["price"] = retail }
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": set})
	return err
}

func (r *ProductRepository) CheckSKUExists(ctx context.Context, sku string, tenantID string, excludeID *primitive.ObjectID) (bool, error) {
	filter := bson.M{"sku": sku, "tenant_id": tenantID}
	if excludeID != nil {
		filter["_id"] = bson.M{"$ne": *excludeID}
	}
	
	count, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
} 

func (r *ProductRepository) BulkDelete(ctx context.Context, ids []primitive.ObjectID, tenantID string) (int64, error) {
	res, err := r.col.DeleteMany(ctx, bson.M{"_id": bson.M{"$in": ids}, "tenant_id": tenantID})
	if err != nil {
		return 0, err
	}
	return res.DeletedCount, nil
}

func (r *ProductRepository) BulkUpdateProperties(ctx context.Context, ids []primitive.ObjectID, tenantID string, update bson.M) (int64, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	res, err := r.col.UpdateMany(ctx, bson.M{"_id": bson.M{"$in": ids}, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil {
		return 0, err
	}
	return res.ModifiedCount, nil
} 

func (r *ProductRepository) BulkArchive(ctx context.Context, ids []primitive.ObjectID, tenantID string, archived bool) (int64, error) {
	set := bson.M{"archived": archived, "updated_at": time.Now().UTC()}
	if archived { set["archived_at"] = time.Now().UTC() } else { set["archived_at"] = nil }
	res, err := r.col.UpdateMany(ctx, bson.M{"_id": bson.M{"$in": ids}, "tenant_id": tenantID}, bson.M{"$set": set})
	if err != nil { return 0, err }
	return res.ModifiedCount, nil
} 

type ProductStats struct { All int64 `bson:"all"`; Active int64 `bson:"active"`; Inactive int64 `bson:"inactive"`; Low int64 `bson:"low"`; Zero int64 `bson:"zero"` }

func (r *ProductRepository) Stats(ctx context.Context, tenantID string, storeID string) (*ProductStats, error) {
	match := bson.M{"tenant_id": tenantID}
	if storeID != "" { if oid, err := primitive.ObjectIDFromHex(storeID); err == nil { match["store_id"] = oid } }
	match["archived"] = bson.M{"$ne": true}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$facet", Value: bson.M{
			"all": mongo.Pipeline{ bson.D{{Key: "$count", Value: "count"}} },
			"active": mongo.Pipeline{ bson.D{{Key: "$match", Value: bson.M{"status": "active"}}}, bson.D{{Key: "$count", Value: "count"}} },
			"inactive": mongo.Pipeline{ bson.D{{Key: "$match", Value: bson.M{"status": "inactive"}}}, bson.D{{Key: "$count", Value: "count"}} },
			"low": mongo.Pipeline{ bson.D{{Key: "$match", Value: bson.M{"$expr": bson.M{"$lt": bson.A{"$stock", "$min_stock"}}}}}, bson.D{{Key: "$count", Value: "count"}} },
			"zero": mongo.Pipeline{ bson.D{{Key: "$match", Value: bson.M{"stock": 0}}}, bson.D{{Key: "$count", Value: "count"}} },
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"all": bson.M{"$ifNull": bson.A{bson.M{"$arrayElemAt": bson.A{"$all.count", 0}}, 0}},
			"active": bson.M{"$ifNull": bson.A{bson.M{"$arrayElemAt": bson.A{"$active.count", 0}}, 0}},
			"inactive": bson.M{"$ifNull": bson.A{bson.M{"$arrayElemAt": bson.A{"$inactive.count", 0}}, 0}},
			"low": bson.M{"$ifNull": bson.A{bson.M{"$arrayElemAt": bson.A{"$low.count", 0}}, 0}},
			"zero": bson.M{"$ifNull": bson.A{bson.M{"$arrayElemAt": bson.A{"$zero.count", 0}}, 0}},
		}}},
	}
	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil { return nil, err }
	defer cur.Close(ctx)
	var out []ProductStats
	if err := cur.All(ctx, &out); err != nil { return nil, err }
	if len(out) == 0 { return &ProductStats{}, nil }
	return &out[0], nil
} 

type ProductSummary struct { Titles int64 `bson:"titles" json:"titles"`; Units int64 `bson:"units" json:"units"`; Supply float64 `bson:"supply" json:"supply"`; Retail float64 `bson:"retail" json:"retail"` }

func (r *ProductRepository) Summary(ctx context.Context, tenantID string, storeID string) (*ProductSummary, error) {
	match := bson.M{"tenant_id": tenantID}
	if storeID != "" { if oid, err := primitive.ObjectIDFromHex(storeID); err == nil { match["store_id"] = oid } }
	match["archived"] = bson.M{"$ne": true}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": nil,
			"titles": bson.M{"$sum": 1},
			"units": bson.M{"$sum": "$stock"},
			"supply": bson.M{"$sum": bson.M{"$multiply": bson.A{"$stock", "$cost_price"}}},
			"retail": bson.M{"$sum": bson.M{"$multiply": bson.A{"$stock", "$price"}}},
		}}},
		bson.D{{Key: "$project", Value: bson.M{"_id": 0, "titles": 1, "units": 1, "supply": 1, "retail": 1}}},
	}
	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil { return nil, err }
	defer cur.Close(ctx)
	var out []ProductSummary
	if err := cur.All(ctx, &out); err != nil { return nil, err }
	if len(out) == 0 { return &ProductSummary{}, nil }
	return &out[0], nil
} 