package repositories

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"shop/backend/internal/models"
)

type LeadRepository struct { db *mongo.Database }

func NewLeadRepository(db *mongo.Database) *LeadRepository { return &LeadRepository{ db: db } }

func (r *LeadRepository) collection() *mongo.Collection { return r.db.Collection("leads") }
func (r *LeadRepository) stagesCollection() *mongo.Collection { return r.db.Collection("pipeline_stages") }

func (r *LeadRepository) List(ctx context.Context, tenantID primitive.ObjectID, filter bson.M, page, limit int64, sort bson.D) ([]models.Lead, int64, error) {
	if page < 1 { page = 1 }
	if limit < 1 || limit > 200 { limit = 20 }
	if filter == nil { filter = bson.M{} }
	filter["tenant_id"] = tenantID
	if _, ok := filter["is_deleted"]; !ok { filter["is_deleted"] = bson.M{"$ne": true} }
	opts := options.Find().SetSkip((page-1)*limit).SetLimit(limit)
	if len(sort) > 0 { opts.SetSort(sort) } else { opts.SetSort(bson.D{{Key: "created_at", Value: -1}}) }
	cur, err := r.collection().Find(ctx, filter, opts); if err != nil { return nil, 0, err }
	defer cur.Close(ctx)
	var items []models.Lead
	if err := cur.All(ctx, &items); err != nil { return nil, 0, err }
	total, err := r.collection().CountDocuments(ctx, filter); if err != nil { return nil, 0, err }
	return items, total, nil
}

func (r *LeadRepository) Get(ctx context.Context, id string) (*models.Lead, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, err }
	var item models.Lead
	if err := r.collection().FindOne(ctx, bson.M{"_id": objID}).Decode(&item); err != nil { return nil, err }
	return &item, nil
}

func (r *LeadRepository) Create(ctx context.Context, tenantID primitive.ObjectID, l models.LeadCreate) (*models.Lead, error) {
	now := time.Now().UTC()
	status := l.Status; if status == "" { status = "new" }
	stage := l.Stage; if stage == "" { stage = status }
	var ownerOID primitive.ObjectID
	if l.OwnerID != "" { if oid, err := primitive.ObjectIDFromHex(l.OwnerID); err == nil { ownerOID = oid } }
	var assignedOID primitive.ObjectID
	if l.AssignedTo != "" { if oid, err := primitive.ObjectIDFromHex(l.AssignedTo); err == nil { assignedOID = oid } }
	var expected time.Time
	if l.ExpectedCloseDate != "" { if t, err := time.Parse(time.RFC3339, l.ExpectedCloseDate); err == nil { expected = t } }
	var closingPtr *time.Time
	if l.ClosingDate != "" { if t, err := time.Parse(time.RFC3339, l.ClosingDate); err == nil { closingPtr = &t } }

	lead := models.Lead{
		Title: l.Title,
		Name: l.Name,
		Description: l.Description,
		Company: l.Company,
		CompanyName: l.CompanyName,
		CustomerName: l.CustomerName,
		ContactName: l.ContactName,
		ContactEmail: l.ContactEmail,
		ContactPhone: l.ContactPhone,
		Contacts: l.Contacts,
		Amount: l.Amount,
		Value: l.Amount,
		Price: l.Price,
		Currency: l.Currency,
		Status: status,
		Stage: stage,
		OwnerID: ownerOID,
		AssignedTo: assignedOID,
		Priority: l.Priority,
		PriorityInt: l.PriorityInt,
		Probability: l.Probability,
		Source: l.Source,
		SourceDetails: l.SourceDetails,
		UTMSource: l.UTMSource,
		UTMMedium: l.UTMMedium,
		UTMCampaign: l.UTMCampaign,
		UTMContent: l.UTMContent,
		UTMTerm: l.UTMTerm,
		ExpectedCloseDate: expected,
		ClosingDate: closingPtr,
		Notes: l.Notes,
		Tags: l.Tags,
		CustomFields: l.CustomFields,
		CreatedAt: now,
		UpdatedAt: now,
		IsDeleted: false,
		TenantID: tenantID,
	}
	res, err := r.collection().InsertOne(ctx, lead)
	if err != nil { return nil, err }
	lead.ID = res.InsertedID.(primitive.ObjectID)
	return &lead, nil
}

func (r *LeadRepository) Update(ctx context.Context, id string, u models.LeadUpdate) (*models.Lead, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, err }
	set := bson.M{"updated_at": time.Now().UTC()}
	if u.Title != nil { set["title"] = *u.Title }
	if u.Name != nil { set["name"] = *u.Name }
	if u.Description != nil { set["description"] = *u.Description }
	if u.Company != nil { set["company"] = *u.Company }
	if u.CompanyName != nil { set["company_name"] = *u.CompanyName }
	if u.CustomerName != nil { set["customer_name"] = *u.CustomerName }
	if u.ContactName != nil { set["contact_name"] = *u.ContactName }
	if u.ContactEmail != nil { set["contact_email"] = *u.ContactEmail }
	if u.ContactPhone != nil { set["contact_phone"] = *u.ContactPhone }
	if u.Contacts != nil { set["contacts"] = *u.Contacts }
	if u.Amount != nil { set["amount"] = *u.Amount; set["value"] = *u.Amount }
	if u.Price != nil { set["price"] = *u.Price }
	if u.Currency != nil { set["currency"] = *u.Currency }
	if u.Status != nil { set["status"] = *u.Status }
	if u.Stage != nil { set["stage"] = *u.Stage }
	if u.OwnerID != nil { if oid, err := primitive.ObjectIDFromHex(*u.OwnerID); err == nil { set["owner_id"] = oid } }
	if u.AssignedTo != nil { if oid, err := primitive.ObjectIDFromHex(*u.AssignedTo); err == nil { set["assigned_to"] = oid } }
	if u.Priority != nil { set["priority"] = *u.Priority }
	if u.PriorityInt != nil { set["priority_int"] = *u.PriorityInt }
	if u.Probability != nil { set["probability"] = *u.Probability }
	if u.Source != nil { set["source"] = *u.Source }
	if u.SourceDetails != nil { set["source_details"] = *u.SourceDetails }
	if u.UTMSource != nil { set["utm_source"] = *u.UTMSource }
	if u.UTMMedium != nil { set["utm_medium"] = *u.UTMMedium }
	if u.UTMCampaign != nil { set["utm_campaign"] = *u.UTMCampaign }
	if u.UTMContent != nil { set["utm_content"] = *u.UTMContent }
	if u.UTMTerm != nil { set["utm_term"] = *u.UTMTerm }
	if u.ExpectedCloseDate != nil { if t, err := time.Parse(time.RFC3339, *u.ExpectedCloseDate); err == nil { set["expected_close_date"] = t } }
	if u.ClosingDate != nil { if t, err := time.Parse(time.RFC3339, *u.ClosingDate); err == nil { set["closing_date"] = t } }
	if u.Notes != nil { set["notes"] = *u.Notes }
	if u.Tags != nil { set["tags"] = *u.Tags }
	if u.CustomFields != nil { set["custom_fields"] = *u.CustomFields }

	if _, err := r.collection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": set}); err != nil { return nil, err }
	return r.Get(ctx, id)
}

func (r *LeadRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil { return err }
	_, err = r.collection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": status, "stage": status, "updated_at": time.Now().UTC()}})
	return err
}

func (r *LeadRepository) BulkUpdate(ctx context.Context, ids []string, update bson.M) error {
	var objIDs []primitive.ObjectID
	for _, id := range ids { if oid, err := primitive.ObjectIDFromHex(id); err == nil { objIDs = append(objIDs, oid) } }
	_, err := r.collection().UpdateMany(ctx, bson.M{"_id": bson.M{"$in": objIDs}}, bson.M{"$set": update})
	return err
}

func (r *LeadRepository) GetStages(ctx context.Context, tenantID primitive.ObjectID) ([]models.PipelineStage, error) {
	cur, err := r.stagesCollection().Find(ctx, bson.M{"tenant_id": tenantID}, options.Find().SetSort(bson.D{{Key: "order", Value: 1}}))
	if err != nil { return nil, err }
	var items []models.PipelineStage
	if err := cur.All(ctx, &items); err != nil { return nil, err }
	return items, nil
}

func (r *LeadRepository) CreateStage(ctx context.Context, tenantID primitive.ObjectID, key, title string, order int) error {
	if key == "" { return mongo.ErrEmptySlice }
	if order <= 0 {
		cnt, err := r.stagesCollection().CountDocuments(ctx, bson.M{"tenant_id": tenantID})
		if err != nil { return err }
		order = int(cnt) + 1
	}
	_, err := r.stagesCollection().InsertOne(ctx, bson.M{"tenant_id": tenantID, "key": key, "title": title, "order": order})
	return err
}

func (r *LeadRepository) ReorderStages(ctx context.Context, tenantID primitive.ObjectID, keys []string) error {
	for i, k := range keys {
		if _, err := r.stagesCollection().UpdateOne(ctx, bson.M{"tenant_id": tenantID, "key": k}, bson.M{"$set": bson.M{"order": i+1}}); err != nil { return err }
	}
	return nil
}

func (r *LeadRepository) DeleteStage(ctx context.Context, tenantID primitive.ObjectID, key string) error {
    _, err := r.stagesCollection().DeleteOne(ctx, bson.M{"tenant_id": tenantID, "key": key})
    return err
} 