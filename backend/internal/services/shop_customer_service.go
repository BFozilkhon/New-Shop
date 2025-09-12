package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopCustomerService struct { repo *repositories.ShopCustomerRepository; contacts *repositories.ShopContactRepository }

func NewShopCustomerService(repo *repositories.ShopCustomerRepository, contacts *repositories.ShopContactRepository) *ShopCustomerService { return &ShopCustomerService{ repo: repo, contacts: contacts } }

func (s *ShopCustomerService) List(ctx context.Context, page, limit int64, search, tenantID string) ([]models.ShopCustomerDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ShopCustomerListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, TenantID: tenantID })
	if err != nil { return nil, 0, utils.Internal("SHOPCUSTOMER_LIST_FAILED", "Unable to list shop customers", err) }
	out := make([]models.ShopCustomerDTO, len(items))
	for i, it := range items {
		// overlay first contact if exists
		if s.contacts != nil {
			cs, _, _ := s.contacts.List(ctx, repositories.ShopContactListParams{ Page: 1, Limit: 1, TenantID: tenantID, CustomerID: it.ID.Hex(), Sort: bson.D{{Key: "created_at", Value: 1}} })
			if len(cs) > 0 {
				c := cs[0]
				it.FirstName = c.FirstName
				it.LastName = c.LastName
				it.Email = c.Email
				it.Phone = c.Phone
				it.CellPhone = c.CellPhone
			}
		}
		out[i] = models.ToShopCustomerDTO(it)
	}
	return out, total, nil
}

func (s *ShopCustomerService) Get(ctx context.Context, id string, tenantID string) (*models.ShopCustomerDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid shop customer id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("SHOPCUSTOMER_NOT_FOUND", "Shop customer not found", err) }
	// overlay contact
	if s.contacts != nil {
		cs, _, _ := s.contacts.List(ctx, repositories.ShopContactListParams{ Page: 1, Limit: 1, TenantID: tenantID, CustomerID: m.ID.Hex(), Sort: bson.D{{Key: "created_at", Value: 1}} })
		if len(cs) > 0 {
			c := cs[0]
			m.FirstName = c.FirstName
			m.LastName = c.LastName
			m.Email = c.Email
			m.Phone = c.Phone
			m.CellPhone = c.CellPhone
		}
	}
	dto := models.ToShopCustomerDTO(*m)
	return &dto, nil
}

func (s *ShopCustomerService) Create(ctx context.Context, body models.ShopCustomerCreate, tenantID string) (*models.ShopCustomerDTO, error) {
	if body.CompanyName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "company_name is required", nil) }
	if body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name is required", nil) }
	// create customer with company and labor_rate only; keep DOT number on customer as requested
	lc := &models.ShopCustomer{ TenantID: tenantID, CompanyName: body.CompanyName, FirstName: "", LastName: "", Phone: "", CellPhone: "", Email: "", DOTNumber: body.DOTNumber, LaborRate: normalizeLaborRate(body.LaborRate) }
	created, err := s.repo.Create(ctx, lc)
	if err != nil { return nil, utils.Internal("SHOPCUSTOMER_CREATE_FAILED", "Unable to create shop customer", err) }
	// also create initial contact
	if created != nil && s.contacts != nil {
		_, _ = s.contacts.Create(ctx, &models.ShopContact{ TenantID: tenantID, CustomerID: created.ID.Hex(), FirstName: body.FirstName, LastName: body.LastName, Email: body.Email, Phone: body.Phone, CellPhone: body.CellPhone })
	}
	dto := models.ToShopCustomerDTO(*created)
	return &dto, nil
}

func (s *ShopCustomerService) Update(ctx context.Context, id string, body models.ShopCustomerUpdate, tenantID string) (*models.ShopCustomerDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid shop customer id", err) }
	update := bson.M{}
	if body.CompanyName != nil { if *body.CompanyName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "company_name cannot be empty", nil) }; update["company_name"] = *body.CompanyName }
	if body.FirstName != nil { if *body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name cannot be empty", nil) }; update["first_name"] = *body.FirstName }
	if body.LastName != nil { update["last_name"] = *body.LastName }
	if body.Phone != nil { update["phone"] = *body.Phone }
	if body.CellPhone != nil { update["cell_phone"] = *body.CellPhone }
	if body.Email != nil { update["email"] = *body.Email }
	if body.DOTNumber != nil { update["dot_number"] = *body.DOTNumber }
	if body.LaborRate != nil { update["labor_rate"] = normalizeLaborRate(*body.LaborRate) }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("SHOPCUSTOMER_UPDATE_FAILED", "Unable to update shop customer", err) }
	dto := models.ToShopCustomerDTO(*updated)
	return &dto, nil
}

func (s *ShopCustomerService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid shop customer id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("SHOPCUSTOMER_DELETE_FAILED", "Unable to delete shop customer", err) }
	return nil
}

// Labor rate constants and helpers

var laborRates = []string{
	"MECHANICAL",
	"ADAPTER_INSTALLATION",
	"ALIGNMENT",
	"BALANCING",
	"BODY_SHOP",
	"BOLT_CUT_FEE",
	"COMPUTER_DIAGNOSTIC",
	"DETAIL",
	"DPF_CLEANING",
	"EGR_CLEANING",
	"ELITE",
	"IDLE_SHUT_DOWN",
	"INSPECTION",
	"INTERNAL",
	"KENWORTH_DPF_CLEANING",
	"PROGRAMMING_EVENT",
	"RECHARGE_AND_RECOVERY",
	"REGEN",
	"ROAD_CALL",
	"SHOCK_INSTALLATION",
	"SPEED_LIMIT_ADJUSTMENT",
	"STORAGE_PARKING",
	"TIRE_DISPOSAL_FEE",
	"TIRE_INSTALLATION",
	"TIRE_PATCH",
	"TIRE_ROTATION",
	"TRAILER_ALIGNMENT",
	"TRANSMISSION_CALIBRATION",
	"TRUCK_WASH",
	"TRUCK_WASH_WITH_DETAIL",
	"VOLVO_UPDATE",
	"WINDSHIELD_REPLACEMENT",
}

func normalizeLaborRate(v string) string {
	if v == "" { return "MECHANICAL" }
	u := v
	for _, k := range laborRates { if u == k { return u } }
	return "MECHANICAL"
}

func (s *ShopCustomerService) LaborRates(ctx context.Context) ([]string, error) { return laborRates, nil } 