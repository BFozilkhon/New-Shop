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

type ParameterListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	Type     string
	Status   string
	Category string
	Required *bool
	TenantID string
}

type ParameterRepository struct {
	col *mongo.Collection
}

func NewParameterRepository(db *mongo.Database) *ParameterRepository {
	return &ParameterRepository{col: db.Collection("parameters")}
}

func (r *ParameterRepository) List(ctx context.Context, p ParameterListParams) ([]models.Parameter, int64, error) {
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
			{"category": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.Type != "" {
		filter["type"] = p.Type
	}
	if p.Status != "" {
		filter["status"] = p.Status
	}
	if p.Category != "" {
		filter["category"] = p.Category
	}
	if p.Required != nil {
		filter["required"] = *p.Required
	}

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(ctx)

	var items []models.Parameter
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *ParameterRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Parameter, error) {
	var m models.Parameter
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ParameterRepository) GetByIDHex(ctx context.Context, id string, tenantID string) (*models.Parameter, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid, tenantID)
}

func (r *ParameterRepository) Create(ctx context.Context, m *models.Parameter) (*models.Parameter, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	
	// Set default status if not provided
	if m.Status == "" {
		m.Status = models.ParameterStatusActive
	}

	res, err := r.col.InsertOne(ctx, m)
	if err != nil {
		return nil, err
	}
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *ParameterRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Parameter, error) {
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

func (r *ParameterRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 