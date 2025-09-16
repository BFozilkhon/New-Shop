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

type AttributeListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
}

type AttributeRepository struct {
	col *mongo.Collection
}

func NewAttributeRepository(db *mongo.Database) *AttributeRepository {
	return &AttributeRepository{col: db.Collection("attributes")}
}

func (r *AttributeRepository) List(ctx context.Context, p AttributeListParams) ([]models.Attribute, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }

	filter := bson.M{"is_deleted": false}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"values": bson.M{"$elemMatch": bson.M{"$regex": p.Search, "$options": "i"}}},
		}
	}
	if p.IsActive != nil { filter["is_active"] = *p.IsActive }

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)

	var items []models.Attribute
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }

	return items, total, nil
}

func (r *AttributeRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Attribute, error) {
	var m models.Attribute
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "is_deleted": false}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *AttributeRepository) GetByIDHex(ctx context.Context, id string) (*models.Attribute, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, err }
	return r.Get(ctx, oid)
}

func (r *AttributeRepository) Create(ctx context.Context, m *models.Attribute) (*models.Attribute, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive { m.IsActive = true }
	if m.Values == nil { m.Values = []string{} }

	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *AttributeRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Attribute, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()

	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *AttributeRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	now := time.Now().UTC()
	update := bson.M{
		"is_deleted": true,
		"updated_at": now,
	}
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
} 