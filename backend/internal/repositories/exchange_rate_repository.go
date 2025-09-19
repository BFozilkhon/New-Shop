package repositories

import (
	"context"
	"time"
	
	"shop/backend/internal/models"
	
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ExchangeRateRepository struct { col *mongo.Collection }

func NewExchangeRateRepository(db *mongo.Database) *ExchangeRateRepository { return &ExchangeRateRepository{ col: db.Collection("exchange_rates") } }

func (r *ExchangeRateRepository) Create(ctx context.Context, tenantID string, rate int, startAt time.Time, createdBy string) (*models.ExchangeRate, error) {
	m := &models.ExchangeRate{ TenantID: tenantID, Rate: rate, StartAt: startAt, EndAt: nil, CreatedAt: time.Now().UTC(), CreatedBy: createdBy }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = toHex(res.InsertedID)
	return m, nil
}

func (r *ExchangeRateRepository) CloseOpenPeriod(ctx context.Context, tenantID string, endAt time.Time) error {
	_, err := r.col.UpdateMany(ctx, bson.M{"tenant_id": tenantID, "end_at": bson.M{"$exists": false}}, bson.M{"$set": bson.M{"end_at": endAt}})
	return err
}

func (r *ExchangeRateRepository) List(ctx context.Context, tenantID string, page, limit int64) ([]models.ExchangeRate, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	filter := bson.M{"tenant_id": tenantID}
	opts := options.Find().SetSort(bson.D{{Key: "start_at", Value: -1}}).SetSkip((page-1)*limit).SetLimit(limit)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.ExchangeRate
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

// FindActiveAt returns the rate active at a given moment (StartAt <= t < EndAt or EndAt nil)
func (r *ExchangeRateRepository) FindActiveAt(ctx context.Context, tenantID string, t time.Time) (*models.ExchangeRate, error) {
	filter := bson.M{
		"tenant_id": tenantID,
		"start_at": bson.M{"$lte": t},
		"$or": []bson.M{{"end_at": bson.M{"$gt": t}}, {"end_at": bson.M{"$exists": false}}},
	}
	var m models.ExchangeRate
	err := r.col.FindOne(ctx, filter, options.FindOne().SetSort(bson.D{{Key: "start_at", Value: -1}})).Decode(&m)
	if err != nil { return nil, err }
	return &m, nil
}

// Helper to convert InsertedID to hex string when type is ObjectID
func toHex(id interface{}) string {
	if oid, ok := id.(interface{ Hex() string }); ok { return oid.Hex() }
	return ""
} 