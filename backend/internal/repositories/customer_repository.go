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

type CustomerListParams struct {
	Page    int64
	Limit   int64
	Sort    bson.D
	Search  string
	TenantID string
}

type CustomerRepository struct { col *mongo.Collection }

func NewCustomerRepository(db *mongo.Database) *CustomerRepository { return &CustomerRepository{ col: db.Collection("customers") } }

func (r *CustomerRepository) List(ctx context.Context, p CustomerListParams) ([]models.Customer, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }
	filter := bson.M{"tenant_id": p.TenantID}
	if p.Search != "" {
		filter["$or"] = []bson.M{
			{"first_name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"last_name": bson.M{"$regex": p.Search, "$options": "i"}},
			{"phone_number": bson.M{"$regex": p.Search, "$options": "i"}},
			{"email": bson.M{"$regex": p.Search, "$options": "i"}},
		}
	}
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Customer
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *CustomerRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.Customer, error) {
	var m models.Customer
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *CustomerRepository) Create(ctx context.Context, m *models.Customer) (*models.Customer, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if m.PrimaryLanguage == "" { m.PrimaryLanguage = "RU" }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *CustomerRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.Customer, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *CustomerRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
} 