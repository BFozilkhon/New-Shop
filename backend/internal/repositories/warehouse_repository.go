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

type WarehouseListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
	Type     string
	TenantID string
}

type WarehouseRepository struct {
	col *mongo.Collection
}

func NewWarehouseRepository(db *mongo.Database) *WarehouseRepository {
	return &WarehouseRepository{col: db.Collection("warehouses")}
}

func (r *WarehouseRepository) List(ctx context.Context, p WarehouseListParams) ([]models.Warehouse, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit > 200 {
		p.Limit = 20
	}
	if p.Sort == nil {
		p.Sort = bson.D{{Key: "name", Value: 1}}
	}

	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"address": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.IsActive != nil {
		filter["is_active"] = *p.IsActive
	}
	if p.Type != "" {
		filter["type"] = p.Type
	}

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(ctx)

	var items []models.Warehouse
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *WarehouseRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Warehouse, error) {
	var m models.Warehouse
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *WarehouseRepository) GetByIDHex(ctx context.Context, id string, tenantID string) (*models.Warehouse, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid, tenantID)
}

func (r *WarehouseRepository) Create(ctx context.Context, m *models.Warehouse) (*models.Warehouse, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive {
		m.IsActive = true
	}

	// Set default type if not provided
	if m.Type == "" {
		m.Type = models.WarehouseTypeMain
	}

	res, err := r.col.InsertOne(ctx, m)
	if err != nil {
		return nil, err
	}
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *WarehouseRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Warehouse, error) {
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

func (r *WarehouseRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 