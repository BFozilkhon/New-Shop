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

type ShopUnitListParams struct {
	Page      int64
	Limit     int64
	Sort      bson.D
	Search    string
	TenantID  string
	CustomerID string
}

type ShopUnitRepository struct { col *mongo.Collection }

func NewShopUnitRepository(db *mongo.Database) *ShopUnitRepository { return &ShopUnitRepository{ col: db.Collection("shop_units") } }

func (r *ShopUnitRepository) List(ctx context.Context, p ShopUnitListParams) ([]models.ShopUnit, int64, error) {
	if p.Page < 1 { p.Page = 1 }
	if p.Limit < 1 || p.Limit > 200 { p.Limit = 20 }
	if p.Sort == nil { p.Sort = bson.D{{Key: "created_at", Value: -1}} }
	filter := bson.M{"tenant_id": p.TenantID, "customer_id": p.CustomerID}
	if p.Search != "" {
		filter["$or"] = []bson.M{{"unit_number": bson.M{"$regex": p.Search, "$options": "i"}}, {"vin": bson.M{"$regex": p.Search, "$options": "i"}}, {"make": bson.M{"$regex": p.Search, "$options": "i"}}, {"model": bson.M{"$regex": p.Search, "$options": "i"}}}
	}
	opts := options.Find().SetSkip((p.Page-1)*p.Limit).SetLimit(p.Limit).SetSort(p.Sort)
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.ShopUnit
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *ShopUnitRepository) Get(ctx context.Context, id primitive.ObjectID, tenantID string) (*models.ShopUnit, error) {
	var m models.ShopUnit
	if err := r.col.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&m); err != nil { return nil, err }
	return &m, nil
}

func (r *ShopUnitRepository) Create(ctx context.Context, m *models.ShopUnit) (*models.ShopUnit, error) {
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	res, err := r.col.InsertOne(ctx, m)
	if err != nil { return nil, err }
	m.ID = res.InsertedID.(primitive.ObjectID)
	return m, nil
}

func (r *ShopUnitRepository) Update(ctx context.Context, id primitive.ObjectID, tenantID string, update bson.M) (*models.ShopUnit, error) {
	if update == nil { update = bson.M{} }
	update["updated_at"] = time.Now().UTC()
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}, bson.M{"$set": update})
	if err != nil { return nil, err }
	return r.Get(ctx, id, tenantID)
}

func (r *ShopUnitRepository) Delete(ctx context.Context, id primitive.ObjectID, tenantID string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}

func (r *ShopUnitRepository) ExistsByUnitNumber(ctx context.Context, tenantID, unitNumber string) (bool, error) {
	cnt, err := r.col.CountDocuments(ctx, bson.M{"tenant_id": tenantID, "unit_number": unitNumber})
	if err != nil { return false, err }
	return cnt > 0, nil
}

func (r *ShopUnitRepository) ExistsByUnitNumberExcept(ctx context.Context, tenantID, unitNumber string, excludeID primitive.ObjectID) (bool, error) {
	filter := bson.M{"tenant_id": tenantID, "unit_number": unitNumber, "_id": bson.M{"$ne": excludeID}}
	cnt, err := r.col.CountDocuments(ctx, filter)
	if err != nil { return false, err }
	return cnt > 0, nil
} 