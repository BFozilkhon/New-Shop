package repositories

import (
	"context"
	"time"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type StatsRepository struct { db *mongo.Database }

func NewStatsRepository(db *mongo.Database) *StatsRepository { return &StatsRepository{ db: db } }

func (r *StatsRepository) CountActiveTenants(ctx context.Context) (int64, error) {
	return r.db.Collection("tenants").CountDocuments(ctx, bson.M{"status": bson.M{"$in": []string{"active", "trial"}}})
}

func (r *StatsRepository) CountUsers(ctx context.Context) (int64, error) {
	return r.db.Collection("users").CountDocuments(ctx, bson.M{"is_deleted": false})
}

func (r *StatsRepository) SumPayments(ctx context.Context) (float64, error) {
	cur, err := r.db.Collection("payments").Aggregate(ctx, []bson.M{{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$amount"}}}})
	if err != nil { return 0, err }
	defer cur.Close(ctx)
	var res []struct{ Total float64 `bson:"total"` }
	if err := cur.All(ctx, &res); err != nil { return 0, err }
	if len(res) == 0 { return 0, nil }
	return res[0].Total, nil
}

type MonthlyPoint struct { Month string `json:"month" bson:"month"`; Amount float64 `json:"amount" bson:"amount"` }

func (r *StatsRepository) MonthlyPayments(ctx context.Context, months int) ([]MonthlyPoint, error) {
	if months <= 0 { months = 12 }
	start := time.Now().UTC().AddDate(0, -months+1, 0)
	pipeline := []bson.M{
		{"$match": bson.M{"created_at": bson.M{"$gte": start}}},
		{"$group": bson.M{
			"_id": bson.M{"y": bson.M{"$year": "$created_at"}, "m": bson.M{"$month": "$created_at"}},
			"amount": bson.M{"$sum": "$amount"},
		}},
		{"$sort": bson.M{"_id.y": 1, "_id.m": 1}},
	}
	cur, err := r.db.Collection("payments").Aggregate(ctx, pipeline)
	if err != nil { return nil, err }
	defer cur.Close(ctx)
	var tmp []struct{ ID struct{ Y int `bson:"y"`; M int `bson:"m"` } `bson:"_id"`; Amount float64 `bson:"amount"` }
	if err := cur.All(ctx, &tmp); err != nil { return nil, err }
	out := make([]MonthlyPoint, 0, len(tmp))
	for _, it := range tmp {
		out = append(out, MonthlyPoint{ Month: time.Date(it.ID.Y, time.Month(it.ID.M), 1, 0,0,0,0, time.UTC).Format("2006-01"), Amount: it.Amount })
	}
	return out, nil
} 