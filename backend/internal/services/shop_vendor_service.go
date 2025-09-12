package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopVendorService struct { repo *repositories.ShopVendorRepository }

func NewShopVendorService(repo *repositories.ShopVendorRepository) *ShopVendorService { return &ShopVendorService{ repo: repo } }

func (s *ShopVendorService) List(ctx context.Context, page, limit int64, search, tenantID string) ([]models.ShopVendorDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ShopVendorListParams{ Page: page, Limit: limit, Search: search, TenantID: tenantID })
	if err != nil { return nil, 0, utils.Internal("SHOPVENDOR_LIST_FAILED", "Unable to list shop vendors", err) }
	out := make([]models.ShopVendorDTO, len(items))
	for i, it := range items { out[i] = models.ToShopVendorDTO(it) }
	return out, total, nil
}

func (s *ShopVendorService) Get(ctx context.Context, id string, tenantID string) (*models.ShopVendorDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid shop vendor id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("SHOPVENDOR_NOT_FOUND", "Shop vendor not found", err) }
	dto := models.ToShopVendorDTO(*m)
	return &dto, nil
}

func (s *ShopVendorService) Create(ctx context.Context, body models.ShopVendorCreate, tenantID string) (*models.ShopVendorDTO, error) {
	if body.VendorName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "vendor_name is required", nil) }
	if body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name is required", nil) }
	m := &models.ShopVendor{ TenantID: tenantID, VendorName: body.VendorName, FirstName: body.FirstName, LastName: body.LastName, Email: body.Email, Phone: body.Phone, CellPhone: body.CellPhone }
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("SHOPVENDOR_CREATE_FAILED", "Unable to create shop vendor", err) }
	dto := models.ToShopVendorDTO(*created)
	return &dto, nil
}

func (s *ShopVendorService) Update(ctx context.Context, id string, body models.ShopVendorUpdate, tenantID string) (*models.ShopVendorDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid shop vendor id", err) }
	update := bson.M{}
	if body.VendorName != nil { if *body.VendorName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "vendor_name cannot be empty", nil) }; update["vendor_name"] = *body.VendorName }
	if body.FirstName != nil { if *body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name cannot be empty", nil) }; update["first_name"] = *body.FirstName }
	if body.LastName != nil { update["last_name"] = *body.LastName }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Phone != nil { update["phone"] = *body.Phone }
	if body.CellPhone != nil { update["cell_phone"] = *body.CellPhone }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("SHOPVENDOR_UPDATE_FAILED", "Unable to update shop vendor", err) }
	dto := models.ToShopVendorDTO(*updated)
	return &dto, nil
}

func (s *ShopVendorService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid shop vendor id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("SHOPVENDOR_DELETE_FAILED", "Unable to delete shop vendor", err) }
	return nil
} 