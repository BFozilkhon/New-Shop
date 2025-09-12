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

type RepricingListParams struct {
	Page   int64
	Limit  int64
	Sort   bson.D
	Search string
	ShopID string
	Status string
	DateFrom string
	DateTo string
	TenantID string
}

type RepricingRepository struct { col *mongo.Collection }

func NewRepricingRepository(db *mongo.Database) *RepricingRepository { return &RepricingRepository{ col: db.Collection("repricings") } }

func (r *RepricingRepository) List(ctx context.Context, p RepricingListParams) ([]models.Repricing, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }

	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" {
		filter["$or"] = []bson.M{{"name": bson.M{"$regex": p.Search, "$options": "i"}}, {"external_id": p.Search}}
	}
	if p.ShopID != "" { filter["shop_id"] = p.ShopID }
	if p.Status != "" { filter["status"] = p.Status }
	if p.DateFrom != "" || p.DateTo != "" {
		d := bson.M{}
		if p.DateFrom != "" { d["$gte"] = p.DateFrom }
		if p.DateTo != "" { d["$lte"] = p.DateTo }
		filter["created_at"] = d
	}

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)

	var items []models.Repricing
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *RepricingRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Repricing, error) {
	var m models.Repricing
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *RepricingRepository) Create(ctx context.Context, m *models.Repricing) (*models.Repricing, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if m.Status == "" { m.Status = "NEW" }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *RepricingRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Repricing, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *RepricingRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 