package services

import (
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CompanyService struct { companies *repositories.CompanyRepository }

type StoreService struct { stores *repositories.StoreRepository }

func NewCompanyService(companies *repositories.CompanyRepository) *CompanyService { return &CompanyService{companies: companies} }
func NewStoreService(stores *repositories.StoreRepository) *StoreService { return &StoreService{stores: stores} }

func tenantFromLocals(c *fiber.Ctx) (primitive.ObjectID, error) {
	v := c.Locals("tenant")
	if v == nil { return primitive.NilObjectID, utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	t := v.(*models.Tenant)
	return t.ID, nil
}

func (s *CompanyService) List(c *fiber.Ctx, page, limit int64, search string) ([]models.CompanyDTO, int64, error) {
	tid, err := tenantFromLocals(c); if err != nil { return nil, 0, err }
	items, total, err := s.companies.List(c.Context(), tid, page, limit, search)
	if err != nil { return nil, 0, utils.Internal("COMPANY_LIST_FAILED", "Unable to list companies", err) }
	out := make([]models.CompanyDTO, len(items))
	for i, it := range items { out[i] = models.ToCompanyDTO(it) }
	return out, total, nil
}

func (s *CompanyService) Get(c *fiber.Ctx, id string) (*models.CompanyDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", err) }
	m, err := s.companies.Get(c.Context(), oid); if err != nil { return nil, utils.NotFound("COMPANY_NOT_FOUND", "Company not found", err) }
	dto := models.ToCompanyDTO(*m); return &dto, nil
}

func (s *CompanyService) Create(c *fiber.Ctx, body models.CompanyCreate) (*models.CompanyDTO, error) {
	tid, err := tenantFromLocals(c); if err != nil { return nil, err }
	m := &models.Company{ TenantID: tid, Title: body.Title, Email: body.Email, Requisites: body.Requisites }
	created, err := s.companies.Create(c.Context(), m)
	if err != nil { return nil, utils.Internal("COMPANY_CREATE_FAILED", "Unable to create company", err) }
	dto := models.ToCompanyDTO(*created)
	return &dto, nil
}

func (s *CompanyService) Update(c *fiber.Ctx, id string, body models.CompanyUpdate) (*models.CompanyDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", err) }
	update := map[string]interface{}{}
	if body.Title != nil { update["title"] = *body.Title }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Requisites != nil { update["requisites"] = *body.Requisites }
	m, err := s.companies.Update(c.Context(), oid, update)
	if err != nil { return nil, utils.Internal("COMPANY_UPDATE_FAILED", "Unable to update company", err) }
	dto := models.ToCompanyDTO(*m)
	return &dto, nil
}

func (s *CompanyService) Delete(c *fiber.Ctx, id string) error {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return utils.BadRequest("INVALID_ID", "Invalid id", err) }
	return s.companies.Delete(c.Context(), oid)
}

func (s *StoreService) List(c *fiber.Ctx, companyID *string, page, limit int64, search string) ([]models.StoreDTO, int64, error) {
	tid, err := tenantFromLocals(c); if err != nil { return nil, 0, err }
	var cid *primitive.ObjectID
	if companyID != nil && *companyID != "" { tmp, err := primitive.ObjectIDFromHex(*companyID); if err == nil { cid = &tmp } }
	items, total, err := s.stores.List(c.Context(), tid, cid, page, limit, search)
	if err != nil { return nil, 0, utils.Internal("STORE_LIST_FAILED", "Unable to list stores", err) }
	out := make([]models.StoreDTO, len(items))
	for i, it := range items { out[i] = models.ToStoreDTO(it) }
	return out, total, nil
}

func (s *StoreService) Get(c *fiber.Ctx, id string) (*models.StoreDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", err) }
	m, err := s.stores.Get(c.Context(), oid); if err != nil { return nil, utils.NotFound("STORE_NOT_FOUND", "Store not found", err) }
	dto := models.ToStoreDTO(*m); return &dto, nil
}

func (s *StoreService) Create(c *fiber.Ctx, body models.StoreCreate) (*models.StoreDTO, error) {
	tid, err := tenantFromLocals(c); if err != nil { return nil, err }
	cid, err := primitive.ObjectIDFromHex(body.CompanyID); if err != nil { return nil, utils.BadRequest("INVALID_COMPANY", "Invalid company id", err) }
	m := &models.Store{ TenantID: tid, CompanyID: cid, Title: body.Title, Square: body.Square, TIN: body.TIN, Working: body.Working, Contacts: body.Contacts }
	created, err := s.stores.Create(c.Context(), m)
	if err != nil { return nil, utils.Internal("STORE_CREATE_FAILED", "Unable to create store", err) }
	dto := models.ToStoreDTO(*created)
	return &dto, nil
}

func (s *StoreService) Update(c *fiber.Ctx, id string, body models.StoreUpdate) (*models.StoreDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", err) }
	update := map[string]interface{}{}
	if body.CompanyID != nil { tmp, err := primitive.ObjectIDFromHex(*body.CompanyID); if err == nil { update["company_id"] = tmp } }
	if body.Title != nil { update["title"] = *body.Title }
	if body.Square != nil { update["square"] = *body.Square }
	if body.TIN != nil { update["tin"] = *body.TIN }
	if body.Working != nil { update["working"] = *body.Working }
	if body.Contacts != nil { update["contacts"] = *body.Contacts }
	m, err := s.stores.Update(c.Context(), oid, update)
	if err != nil { return nil, utils.Internal("STORE_UPDATE_FAILED", "Unable to update store", err) }
	dto := models.ToStoreDTO(*m)
	return &dto, nil
}

func (s *StoreService) Delete(c *fiber.Ctx, id string) error {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return utils.BadRequest("INVALID_ID", "Invalid id", err) }
	return s.stores.Delete(c.Context(), oid)
} 