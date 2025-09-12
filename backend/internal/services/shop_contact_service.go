package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopContactService struct { repo *repositories.ShopContactRepository }

func NewShopContactService(repo *repositories.ShopContactRepository) *ShopContactService { return &ShopContactService{ repo: repo } }

func (s *ShopContactService) List(ctx context.Context, page, limit int64, search, tenantID, customerID string) ([]models.ShopContactDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ShopContactListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, TenantID: tenantID, CustomerID: customerID })
	if err != nil { return nil, 0, utils.Internal("SHOPCONTACT_LIST_FAILED", "Unable to list contacts", err) }
	out := make([]models.ShopContactDTO, len(items))
	for i, it := range items { out[i] = models.ToShopContactDTO(it) }
	return out, total, nil
}

func (s *ShopContactService) Get(ctx context.Context, id, tenantID string) (*models.ShopContactDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid contact id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("SHOPCONTACT_NOT_FOUND", "Contact not found", err) }
	dto := models.ToShopContactDTO(*m)
	return &dto, nil
}

func (s *ShopContactService) Create(ctx context.Context, body models.ShopContactCreate, tenantID string) (*models.ShopContactDTO, error) {
	if body.CustomerID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_id is required", nil) }
	if body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name is required", nil) }
	m := &models.ShopContact{ TenantID: tenantID, CustomerID: body.CustomerID, FirstName: body.FirstName, LastName: body.LastName, Email: body.Email, Phone: body.Phone, CellPhone: body.CellPhone }
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("SHOPCONTACT_CREATE_FAILED", "Unable to create contact", err) }
	dto := models.ToShopContactDTO(*created)
	return &dto, nil
}

func (s *ShopContactService) Update(ctx context.Context, id string, body models.ShopContactUpdate, tenantID string) (*models.ShopContactDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid contact id", err) }
	update := bson.M{}
	if body.FirstName != nil { if *body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name cannot be empty", nil) }; update["first_name"] = *body.FirstName }
	if body.LastName != nil { update["last_name"] = *body.LastName }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Phone != nil { update["phone"] = *body.Phone }
	if body.CellPhone != nil { update["cell_phone"] = *body.CellPhone }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("SHOPCONTACT_UPDATE_FAILED", "Unable to update contact", err) }
	dto := models.ToShopContactDTO(*updated)
	return &dto, nil
}

func (s *ShopContactService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid contact id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("SHOPCONTACT_DELETE_FAILED", "Unable to delete contact", err) }
	return nil
} 