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

type TenantRepository struct { col *mongo.Collection }

func NewTenantRepository(db *mongo.Database) *TenantRepository { return &TenantRepository{ col: db.Collection("tenants") } }

func (r *TenantRepository) Create(ctx context.Context, m *models.Tenant) (*models.Tenant, error) {
	now := time.Now().UTC()
	m.CreatedAt = now; m.UpdatedAt = now
	if m.Settings.Language == "" { m.Settings = models.GetDefaultTenantSettings() }
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *TenantRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Tenant, error) {
	var m models.Tenant
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *TenantRepository) GetBySubdomain(ctx context.Context, sub string) (*models.Tenant, error) {
	var m models.Tenant
	if err := r.col.FindOne(ctx, bson.M{"subdomain": sub}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *TenantRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Tenant, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *TenantRepository) List(ctx context.Context, page, limit int64, search string) ([]models.Tenant, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	filter := bson.M{}
	if search != "" { filter["$or"] = []bson.M{{"company_name": bson.M{"$regex": search, "$options": "i"}}, {"subdomain": bson.M{"$regex": search, "$options": "i"}}} }
	opts := options.Find().SetSkip((page-1)*limit).SetLimit(limit).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Tenant
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
} 

func (r *TenantRepository) CreateDefaultStages(ctx context.Context, tenantID primitive.ObjectID) error {
    stagesCol := r.col.Database().Collection("pipeline_stages")
    // only create default stages if none exist for this tenant
    count, err := stagesCol.CountDocuments(ctx, bson.M{"tenant_id": tenantID})
    if err != nil { return err }
    if count > 0 { return nil }

    defaultStages := []interface{}{
        bson.M{"tenant_id": tenantID, "key": "new", "title": "New", "order": 1},
        bson.M{"tenant_id": tenantID, "key": "contacted", "title": "Contacted", "order": 2},
        bson.M{"tenant_id": tenantID, "key": "qualified", "title": "Qualified", "order": 3},
        bson.M{"tenant_id": tenantID, "key": "proposal", "title": "Proposal", "order": 4},
        bson.M{"tenant_id": tenantID, "key": "negotiation", "title": "Negotiation", "order": 5},
        bson.M{"tenant_id": tenantID, "key": "won", "title": "Won", "order": 6},
        bson.M{"tenant_id": tenantID, "key": "lost", "title": "Lost", "order": 7},
    }
    _, err = stagesCol.InsertMany(ctx, defaultStages)
    return err
} 