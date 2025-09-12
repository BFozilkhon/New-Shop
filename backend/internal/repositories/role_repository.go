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

type RoleListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
}

type RoleRepository struct { col *mongo.Collection }

func NewRoleRepository(db *mongo.Database) *RoleRepository { return &RoleRepository{col: db.Collection("roles")} }

func (r *RoleRepository) List(ctx context.Context, p RoleListParams) ([]models.Role, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }
	filter := bson.M{"is_deleted": false}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"key": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	if p.IsActive != nil { filter["is_active"] = *p.IsActive }
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Role
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *RoleRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Role, error) {
	var m models.Role
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "is_deleted": false}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *RoleRepository) GetByKey(ctx context.Context, key string) (*models.Role, error) {
	var m models.Role
	if err := r.col.FindOne(ctx, bson.M{"key": key, "is_deleted": false}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *RoleRepository) Create(ctx context.Context, m *models.Role) (*models.Role, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if !m.IsActive { m.IsActive = true }
	m.IsDeleted = false
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *RoleRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Role, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "is_deleted": false}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *RoleRepository) SoftDelete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "is_deleted": false}, bson.M{"$set": bson.M{"is_deleted": true, "updated_at": time.Now().UTC()}})
	return err
} 