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

type ImportHistoryListParams struct { TenantID primitive.ObjectID; Page int64; Limit int64; Sort bson.D; StoreID *primitive.ObjectID }

type ImportHistoryRepository struct { col *mongo.Collection }

func NewImportHistoryRepository(db *mongo.Database) *ImportHistoryRepository { return &ImportHistoryRepository{ col: db.Collection("import_history") } }

func (r *ImportHistoryRepository) List(ctx context.Context, p ImportHistoryListParams) ([]models.ImportHistory, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }
	filter := bson.M{"tenant_id": p.TenantID}
    if p.StoreID != nil { filter["store_id"] = *p.StoreID }
	cur, err := r.col.Find(ctx, filter, options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort))
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.ImportHistory
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *ImportHistoryRepository) Create(ctx context.Context, m *models.ImportHistory) (*models.ImportHistory, error) {
	now := time.Now().UTC(); m.CreatedAt = now
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
} 