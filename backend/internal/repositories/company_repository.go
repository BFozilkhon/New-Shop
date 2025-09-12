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

type CompanyRepository struct { col *mongo.Collection }

func NewCompanyRepository(db *mongo.Database) *CompanyRepository { return &CompanyRepository{ col: db.Collection("companies") } }

func (r *CompanyRepository) List(ctx context.Context, tenantID primitive.ObjectID, page, limit int64, search string) ([]models.Company, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	filter := bson.M{"tenant_id": tenantID}
	if search != "" { filter["$or"] = []bson.M{{"title": bson.M{"$regex": search, "$options": "i"}}, {"email": bson.M{"$regex": search, "$options": "i"}}} }
	opts := options.Find().SetSkip((page-1)*limit).SetLimit(limit).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Company
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *CompanyRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Company, error) {
	var m models.Company
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *CompanyRepository) Create(ctx context.Context, m *models.Company) (*models.Company, error) {
	now := time.Now().UTC(); m.CreatedAt = now; m.UpdatedAt = now
	res, err := r.col.InsertOne(ctx, m); if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *CompanyRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Company, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update}); if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *CompanyRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// Stores

type StoreRepository struct { col *mongo.Collection }

func NewStoreRepository(db *mongo.Database) *StoreRepository { return &StoreRepository{ col: db.Collection("stores") } }

func (r *StoreRepository) List(ctx context.Context, tenantID primitive.ObjectID, companyID *primitive.ObjectID, page, limit int64, search string) ([]models.Store, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	filter := bson.M{"tenant_id": tenantID}
	if companyID != nil { filter["company_id"] = *companyID }
	if search != "" { filter["title"] = bson.M{"$regex": search, "$options": "i"} }
	opts := options.Find().SetSkip((page-1)*limit).SetLimit(limit).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Store
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *StoreRepository) Get(ctx context.Context, id primitive.ObjectID) (*models.Store, error) {
	var m models.Store
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *StoreRepository) GetByIDHex(ctx context.Context, id string, tenantID string) (*models.Store, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, err }
	return r.Get(ctx, oid)
}

func (r *StoreRepository) Create(ctx context.Context, m *models.Store) (*models.Store, error) {
	now := time.Now().UTC(); m.CreatedAt = now; m.UpdatedAt = now
	res, err := r.col.InsertOne(ctx, m); if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *StoreRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.Store, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update}); if err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *StoreRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	return err
} 