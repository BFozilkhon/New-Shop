package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SupplierService struct { repo *repositories.SupplierRepository }

func NewSupplierService(repo *repositories.SupplierRepository) *SupplierService { return &SupplierService{repo: repo} }

func (s *SupplierService) List(ctx context.Context, page, limit int64, search string) ([]models.SupplierDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.SupplierListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search })
	if err != nil { return nil, 0, utils.Internal("SUPPLIER_LIST_FAILED", "Unable to list suppliers", err) }
	out := make([]models.SupplierDTO, len(items))
	for i, it := range items { out[i] = models.ToSupplierDTO(it) }
	return out, total, nil
}

func (s *SupplierService) Get(ctx context.Context, id string) (*models.SupplierDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid supplier id", err) }
	m, err := s.repo.Get(ctx, oid)
	if err != nil { return nil, utils.NotFound("SUPPLIER_NOT_FOUND", "Supplier not found", err) }
	dto := models.ToSupplierDTO(*m)
	return &dto, nil
}

func (s *SupplierService) Create(ctx context.Context, body models.SupplierCreate) (*models.SupplierDTO, error) {
	if body.Name == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "name is required", nil) }
	m := &models.Supplier{
		TenantID: body.TenantID,
		Name: body.Name,
		DefaultMarkupPercentage: body.DefaultMarkupPercentage,
		Phone: body.Phone,
		Email: body.Email,
		Notes: body.Notes,
		LegalAddress: body.LegalAddress,
		BankAccount: body.BankAccount,
		BankNameBranch: body.BankNameBranch,
		INN: body.INN,
		MFO: body.MFO,
		Documents: body.Documents,
	}
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("SUPPLIER_CREATE_FAILED", "Unable to create supplier", err) }
	dto := models.ToSupplierDTO(*created)
	return &dto, nil
}

func (s *SupplierService) Update(ctx context.Context, id string, body models.SupplierUpdate) (*models.SupplierDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid supplier id", err) }
	update := bson.M{}
	if body.TenantID != nil { update["tenant_id"] = *body.TenantID }
	if body.Name != nil { update["name"] = *body.Name }
	if body.DefaultMarkupPercentage != nil { update["default_markup_percentage"] = *body.DefaultMarkupPercentage }
	if body.Phone != nil { update["phone"] = *body.Phone }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Notes != nil { update["notes"] = *body.Notes }
	if body.LegalAddress != nil { update["legal_address"] = *body.LegalAddress }
	if body.BankAccount != nil { update["bank_account"] = *body.BankAccount }
	if body.BankNameBranch != nil { update["bank_name_branch"] = *body.BankNameBranch }
	if body.INN != nil { update["inn"] = *body.INN }
	if body.MFO != nil { update["mfo"] = *body.MFO }
	if body.Documents != nil { update["documents"] = *body.Documents }
	updated, err := s.repo.Update(ctx, oid, update)
	if err != nil { return nil, utils.Internal("SUPPLIER_UPDATE_FAILED", "Unable to update supplier", err) }
	dto := models.ToSupplierDTO(*updated)
	return &dto, nil
}

func (s *SupplierService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid supplier id", err) }
	if err := s.repo.Delete(ctx, oid); err != nil { return utils.Internal("SUPPLIER_DELETE_FAILED", "Unable to delete supplier", err) }
	return nil
} 