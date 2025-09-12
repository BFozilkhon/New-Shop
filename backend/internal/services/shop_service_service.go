package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopServiceService struct {
	repo      *repositories.ShopServiceRepository
	customers *repositories.ShopCustomerRepository
	units     *repositories.ShopUnitRepository
}

func NewShopServiceService(repo *repositories.ShopServiceRepository, customers *repositories.ShopCustomerRepository, units *repositories.ShopUnitRepository) *ShopServiceService {
	return &ShopServiceService{ repo: repo, customers: customers, units: units }
}

func (s *ShopServiceService) List(ctx context.Context, page, limit int64, search, tenantID, customerID string) ([]models.ShopServiceDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ShopServiceListParams{ Page: page, Limit: limit, Search: search, TenantID: tenantID, CustomerID: customerID })
	if err != nil { return nil, 0, utils.Internal("SHOPSERVICE_LIST_FAILED", "Unable to list services", err) }
	out := make([]models.ShopServiceDTO, len(items))
	for i, it := range items {
		d := models.ToShopServiceDTO(it)
		// enrich labels
		if s.customers != nil && it.CustomerID != "" {
			if oid, err := primitive.ObjectIDFromHex(it.CustomerID); err == nil {
				if c, err2 := s.customers.Get(ctx, oid, tenantID); err2 == nil {
					d.CustomerName = c.CompanyName
				}
			}
		}
		if s.units != nil && it.UnitID != "" {
			if oid, err := primitive.ObjectIDFromHex(it.UnitID); err == nil {
				if u, err2 := s.units.Get(ctx, oid, tenantID); err2 == nil {
					label := u.UnitNumber
					if label == "" { label = u.VIN }
					if label == "" { label = u.ID.Hex() }
					d.UnitLabel = label
				}
			}
		}
		out[i] = d
	}
	return out, total, nil
}

func (s *ShopServiceService) Get(ctx context.Context, id, tenantID string) (*models.ShopServiceDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid service id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("SHOPSERVICE_NOT_FOUND", "Service not found", err) }
	dto := models.ToShopServiceDTO(*m)
	// enrich labels
	if s.customers != nil && m.CustomerID != "" {
		if coid, err := primitive.ObjectIDFromHex(m.CustomerID); err == nil {
			if c, err2 := s.customers.Get(ctx, coid, tenantID); err2 == nil { dto.CustomerName = c.CompanyName }
		}
	}
	if s.units != nil && m.UnitID != "" {
		if uoid, err := primitive.ObjectIDFromHex(m.UnitID); err == nil {
			if u, err2 := s.units.Get(ctx, uoid, tenantID); err2 == nil {
				label := u.UnitNumber
				if label == "" { label = u.VIN }
				if label == "" { label = u.ID.Hex() }
				dto.UnitLabel = label
			}
		}
	}
	return &dto, nil
}

func computeTotals(body *models.ShopService) {
	var laborTotal float64
	var partsTotal float64
	for i := range body.Items {
		item := &body.Items[i]
		item.LaborCost = item.LaborHours * item.LaborRate
		item.LaborPrice = item.LaborCost // could apply markup later
		laborTotal += item.LaborPrice
		for _, p := range item.Parts {
			partsTotal += float64(p.Quantity) * p.Price
		}
	}
	var extrasTotal float64
	for _, e := range body.Extras { extrasTotal += e.Amount }
	body.LaborTotal = laborTotal
	body.PartsTotal = partsTotal
	body.ExtrasTotal = extrasTotal
	body.Subtotal = body.ShopSupplies + laborTotal + partsTotal + extrasTotal
	// tax
	if body.TaxLocation == "LOCAL" { body.TaxRate = 0.075 } else { body.TaxLocation = "EXEMPT"; body.TaxRate = 0 }
	body.TaxAmount = body.Subtotal * body.TaxRate
	body.Total = body.Subtotal + body.TaxAmount
}

func (s *ShopServiceService) Create(ctx context.Context, body models.ShopServiceCreate, tenantID string) (*models.ShopServiceDTO, error) {
	if body.CustomerID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_id is required", nil) }
	if body.UnitID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "unit_id is required", nil) }
	if body.TechnicianID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "technician_id is required", nil) }
	if body.CustomerComplaint == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_complaint is required", nil) }
	if body.EstimateNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "estimate_number is required", nil) }
	m := &models.ShopService{ TenantID: tenantID, CustomerID: body.CustomerID, ContactID: body.ContactID, UnitID: body.UnitID, ChassisMiles: body.ChassisMiles, CustomerComplaint: body.CustomerComplaint, TechnicianID: body.TechnicianID, Notes: body.Notes, EstimateNumber: body.EstimateNumber, AuthorizationNumber: body.AuthorizationNumber, PONumber: body.PONumber, Description: body.Description, Items: body.Items, ShopSupplies: body.ShopSupplies, Extras: body.Extras, TaxLocation: body.TaxLocation }
	computeTotals(m)
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("SHOPSERVICE_CREATE_FAILED", "Unable to create service", err) }
	dto := models.ToShopServiceDTO(*created)
	return &dto, nil
}

func (s *ShopServiceService) Update(ctx context.Context, id string, body models.ShopServiceUpdate, tenantID string) (*models.ShopServiceDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid service id", err) }
	update := bson.M{}
	if body.CustomerID != nil { if *body.CustomerID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_id cannot be empty", nil) }; update["customer_id"] = *body.CustomerID }
	if body.ContactID != nil { update["contact_id"] = *body.ContactID }
	if body.UnitID != nil { if *body.UnitID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "unit_id cannot be empty", nil) }; update["unit_id"] = *body.UnitID }
	if body.ChassisMiles != nil { update["chassis_miles"] = *body.ChassisMiles }
	if body.CustomerComplaint != nil { if *body.CustomerComplaint == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_complaint cannot be empty", nil) }; update["customer_complaint"] = *body.CustomerComplaint }
	if body.TechnicianID != nil { update["technician_id"] = *body.TechnicianID }
	if body.Notes != nil { update["notes"] = *body.Notes }
	if body.EstimateNumber != nil { if *body.EstimateNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "estimate_number cannot be empty", nil) }; update["estimate_number"] = *body.EstimateNumber }
	if body.AuthorizationNumber != nil { update["authorization_number"] = *body.AuthorizationNumber }
	if body.PONumber != nil { update["po_number"] = *body.PONumber }
	if body.Description != nil { update["description"] = *body.Description }
	if body.Items != nil { update["items"] = *body.Items }
	if body.ShopSupplies != nil { update["shop_supplies"] = *body.ShopSupplies }
	if body.Extras != nil { update["extras"] = *body.Extras }
	if body.TaxLocation != nil { update["tax_location"] = *body.TaxLocation }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("SHOPSERVICE_UPDATE_FAILED", "Unable to update service", err) }
	computeTotals(updated)
	_, _ = s.repo.Update(ctx, oid, tenantID, bson.M{"labor_total": updated.LaborTotal, "parts_total": updated.PartsTotal, "extras_total": updated.ExtrasTotal, "subtotal": updated.Subtotal, "tax_location": updated.TaxLocation, "tax_rate": updated.TaxRate, "tax_amount": updated.TaxAmount, "total": updated.Total})
	dto := models.ToShopServiceDTO(*updated)
	return &dto, nil
}

func (s *ShopServiceService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid service id", nil) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("SHOPSERVICE_DELETE_FAILED", "Unable to delete service", err) }
	return nil
} 