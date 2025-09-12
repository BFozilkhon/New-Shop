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

type PaymentRepository struct { col *mongo.Collection }

func NewPaymentRepository(db *mongo.Database) *PaymentRepository { return &PaymentRepository{ col: db.Collection("payments") } }

type PaymentListParams struct {
	TenantID string
	Page int64
	Limit int64
	Search string
}

func (r *PaymentRepository) List(ctx context.Context, p PaymentListParams) ([]models.PaymentDTO, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	filter := bson.M{}
	if p.TenantID != "" {
		if oid, err := primitive.ObjectIDFromHex(p.TenantID); err == nil { filter["tenant_id"] = oid }
	}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"method": bson.M{"$regex": p.Search, "$options": "i"}},
			{"status": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Payment
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	res := make([]models.PaymentDTO, 0, len(items))
	for _, it := range items {
		res = append(res, models.PaymentDTO{
			ID: it.ID, TenantID: it.TenantID, Amount: it.Amount, Currency: it.Currency, Method: it.Method, Status: it.Status, Note: it.Note, Period: it.Period, CreatedAt: it.CreatedAt,
		})
	}
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return res, total, nil
}

func (r *PaymentRepository) Create(ctx context.Context, m *models.Payment) (*models.Payment, error) {
	m.CreatedAt = time.Now().UTC()
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
} 