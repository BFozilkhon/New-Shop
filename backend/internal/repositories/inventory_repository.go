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

type InventoryListParams struct {
	TenantID  string
	Page      int64
	Limit     int64
	Search    string
	ShopID    string
	StatusID  string
	Type      string
	SortBy    string
	SortOrder int
	DateFrom  *time.Time
	DateTo    *time.Time
}

type InventoryRepository struct { col *mongo.Collection }

func NewInventoryRepository(db *mongo.Database) *InventoryRepository { return &InventoryRepository{ col: db.Collection("inventories") } }

func (r *InventoryRepository) List(ctx context.Context, p InventoryListParams) ([]models.Inventory, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"shop_name": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.ShopID != "" { filter["shop_id"] = p.ShopID }
	if p.StatusID != "" { filter["status_id"] = p.StatusID }
	if p.Type != "" { filter["type"] = p.Type }
	if p.DateFrom != nil || p.DateTo != nil {
		dt := bson.M{}
		if p.DateFrom != nil { dt["$gte"] = *p.DateFrom }
		if p.DateTo != nil { dt["$lte"] = *p.DateTo }
		filter["created_at"] = dt
	}
	sortKey := "created_at"
	if p.SortBy != "" { sortKey = p.SortBy }
	order := -1
	if p.SortOrder != 0 { order = p.SortOrder }
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(bson.D{{Key: sortKey, Value: order}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Inventory
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *InventoryRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Inventory, error) {
	var m models.Inventory
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *InventoryRepository) Create(ctx context.Context, m *models.Inventory) (*models.Inventory, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if m.Items == nil { m.Items = []models.InventoryItem{} }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *InventoryRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Inventory, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *InventoryRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 