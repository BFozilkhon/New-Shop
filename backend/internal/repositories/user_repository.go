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

type UserListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
	RoleID   *primitive.ObjectID
}

type UserRepository struct { col *mongo.Collection }

func NewUserRepository(db *mongo.Database) *UserRepository { return &UserRepository{col: db.Collection("users")} }

func (r *UserRepository) List(ctx context.Context, p UserListParams) ([]models.User, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }
	filter := bson.M{}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"email": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.IsActive != nil { filter["is_active"] = *p.IsActive }
	if p.RoleID != nil { filter["role_id"] = *p.RoleID }
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.User
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *UserRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var m models.User
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *UserRepository) GetByIDHex(ctx context.Context, id string) (*models.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, err }
	return r.Get(ctx, oid)
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var m models.User
	if err := r.col.FindOne(ctx, bson.M{"email": email}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *UserRepository) Create(ctx context.Context, m *models.User) (*models.User, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive { m.IsActive = true }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *UserRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.User, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *UserRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	return err
} 