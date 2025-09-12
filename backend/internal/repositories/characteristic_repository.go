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

type CharacteristicListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
	Type     string
}

type CharacteristicRepository struct {
	col *mongo.Collection
}

func NewCharacteristicRepository(db *mongo.Database) *CharacteristicRepository {
	return &CharacteristicRepository{col: db.Collection("characteristics")}
}

func (r *CharacteristicRepository) List(ctx context.Context, p CharacteristicListParams) ([]models.Characteristic, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit > 200 {
		p.Limit = 20
	}
	if p.Sort == nil {
		p.Sort = bson.D{{Key: "created_at", Value: -1}}
	}

	filter := bson.M{"is_deleted": false}
	if p.Search != "" {
		filter["name"] = bson.M{"$regex": p.Search, "$options": "i"}
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

	var items []models.Characteristic
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *CharacteristicRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Characteristic, error) {
	var m models.Characteristic
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "is_deleted": false}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *CharacteristicRepository) GetByIDHex(ctx context.Context, id string) (*models.Characteristic, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid)
}

func (r *CharacteristicRepository) Create(ctx context.Context, m *models.Characteristic) (*models.Characteristic, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive {
		m.IsActive = true
	}

	res, err := r.col.InsertOne(ctx, m)
	if err != nil {
		return nil, err
	}
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *CharacteristicRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Characteristic, error) {
	if update == nil {
		update = bson.M{}
	}
	update["updated_at"] = time.Now().UTC()

	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *CharacteristicRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	now := time.Now().UTC()
	update := bson.M{
		"is_deleted": true,
		"updated_at": now,
	}
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
} 