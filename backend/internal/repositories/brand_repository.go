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

type BrandListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
	TenantID string
}

type BrandRepository struct {
	col *mongo.Collection
}

func NewBrandRepository(db *mongo.Database) *BrandRepository {
	return &BrandRepository{col: db.Collection("brands")}
}

func (r *BrandRepository) List(ctx context.Context, p BrandListParams) ([]models.Brand, int64, error) {
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
			{"description": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.IsActive != nil {
		filter["is_active"] = *p.IsActive
	}

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(ctx)

	var items []models.Brand
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *BrandRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Brand, error) {
	var m models.Brand
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *BrandRepository) GetByIDHex(ctx context.Context, id string, tenantID string) (*models.Brand, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid, tenantID)
}

func (r *BrandRepository) Create(ctx context.Context, m *models.Brand) (*models.Brand, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive {
		m.IsActive = true
	}
	m.ProductCount = 0

	res, err := r.col.InsertOne(ctx, m)
	if err != nil {
		return nil, err
	}
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *BrandRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Brand, error) {
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

func (r *BrandRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}

func (r *BrandRepository) UpdateProductCount(ctx context.Context, brandID primitive.ObjectID, tenantID string, count int) error {
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"_id": brandID, "tenant_id": tenantID},
		bson.M{"$set": bson.M{"product_count": count, "updated_at": time.Now().UTC()}},
	)
	return err
} 