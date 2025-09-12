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

type PriceTagListParams struct {
	TenantID string
	Page int64
	Limit int64
	Search string
}

type PriceTagRepository struct { col *mongo.Collection }

func NewPriceTagRepository(db *mongo.Database) *PriceTagRepository { return &PriceTagRepository{ col: db.Collection("price_tag_templates") } }

func (r *PriceTagRepository) List(ctx context.Context, p PriceTagListParams) ([]models.PriceTagTemplate, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" { filter["name"] = bson.M{"$regex": p.Search, "$options": "i"} }
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.PriceTagTemplate
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter); if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *PriceTagRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.PriceTagTemplate, error) {
	var m models.PriceTagTemplate
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *PriceTagRepository) Create(ctx context.Context, m *models.PriceTagTemplate) (*models.PriceTagTemplate, error) {
	now := time.Now().UTC()
	m.CreatedAt = now; m.UpdatedAt = now
	res, err := r.col.InsertOne(ctx, m); if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *PriceTagRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.PriceTagTemplate, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update}); if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *PriceTagRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 