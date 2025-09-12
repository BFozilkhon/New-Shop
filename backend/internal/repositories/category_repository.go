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

type CategoryListParams struct {
	Page     int64
	Limit    int64
	Sort     bson.D
	Search   string
	IsActive *bool
	ParentID *primitive.ObjectID
	Level    *int
}

type CategoryRepository struct {
	col *mongo.Collection
}

func NewCategoryRepository(db *mongo.Database) *CategoryRepository {
	return &CategoryRepository{col: db.Collection("categories")}
}

func (r *CategoryRepository) List(ctx context.Context, p CategoryListParams) ([]models.Category, int64, error) {
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
	if p.ParentID != nil {
		filter["parent_id"] = *p.ParentID
	} else if p.Level != nil && *p.Level == 0 {
		filter["parent_id"] = bson.M{"$exists": false}
	}
	if p.Level != nil {
		filter["level"] = *p.Level
	}

	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(ctx)

	var items []models.Category
	if err := cur.All(ctx, &items); err != nil {
		return nil, 0, err
	}

	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *CategoryRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Category, error) {
	var m models.Category
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "is_deleted": false}).Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *CategoryRepository) GetByIDHex(ctx context.Context, id string) (*models.Category, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, oid)
}

func (r *CategoryRepository) GetChildren(ctx context.Context, parentID primitive.ObjectID) ([]models.Category, error) {
	filter := bson.M{"parent_id": parentID, "is_deleted": false}
	cur, err := r.col.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "name", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var items []models.Category
	if err := cur.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *CategoryRepository) GetRootCategories(ctx context.Context) ([]models.Category, error) {
	filter := bson.M{"parent_id": bson.M{"$exists": false}, "is_deleted": false}
	cur, err := r.col.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "name", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var items []models.Category
	if err := cur.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *CategoryRepository) Create(ctx context.Context, m *models.Category) (*models.Category, error) {
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

func (r *CategoryRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Category, error) {
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

func (r *CategoryRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	now := time.Now().UTC()
	update := bson.M{
		"is_deleted": true,
		"updated_at": now,
	}
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func (r *CategoryRepository) HasChildren(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.col.CountDocuments(ctx, bson.M{"parent_id": id, "is_deleted": false})
	if err != nil {
		return false, err
	}
	return count > 0, nil
} 