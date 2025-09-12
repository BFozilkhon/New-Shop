package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopUnitService struct { repo *repositories.ShopUnitRepository }

func NewShopUnitService(repo *repositories.ShopUnitRepository) *ShopUnitService { return &ShopUnitService{ repo: repo } }

func (s *ShopUnitService) List(ctx context.Context, page, limit int64, search, tenantID, customerID string) ([]models.ShopUnitDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ShopUnitListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, TenantID: tenantID, CustomerID: customerID })
	if err != nil { return nil, 0, utils.Internal("SHOPUNIT_LIST_FAILED", "Unable to list units", err) }
	out := make([]models.ShopUnitDTO, len(items))
	for i, it := range items { out[i] = models.ToShopUnitDTO(it) }
	return out, total, nil
}

func (s *ShopUnitService) Get(ctx context.Context, id, tenantID string) (*models.ShopUnitDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid unit id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("SHOPUNIT_NOT_FOUND", "Unit not found", err) }
	dto := models.ToShopUnitDTO(*m)
	return &dto, nil
}

func (s *ShopUnitService) Create(ctx context.Context, body models.ShopUnitCreate, tenantID string) (*models.ShopUnitDTO, error) {
	if body.CustomerID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "customer_id is required", nil) }
	if body.Type == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "type is required", nil) }
	if body.VIN == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "vin is required", nil) }
	if body.UnitNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "unit_number is required", nil) }
	if exists, err := s.repo.ExistsByUnitNumber(ctx, tenantID, body.UnitNumber); err != nil { return nil, utils.Internal("CHECK_UNIQUE_FAILED", "Failed to check unit number", err) } else if exists { return nil, utils.Conflict("UNIT_NUMBER_EXISTS", "Unit number already exists", nil) }
	m := &models.ShopUnit{ TenantID: tenantID, CustomerID: body.CustomerID, Type: body.Type, VIN: body.VIN, Year: body.Year, Make: body.Make, Model: body.Model, UnitNumber: body.UnitNumber, UnitNickname: body.UnitNickname, Fleet: body.Fleet, LicensePlateState: body.LicensePlateState, LicensePlate: body.LicensePlate }
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("SHOPUNIT_CREATE_FAILED", "Unable to create unit", err) }
	dto := models.ToShopUnitDTO(*created)
	return &dto, nil
}

func (s *ShopUnitService) Update(ctx context.Context, id string, body models.ShopUnitUpdate, tenantID string) (*models.ShopUnitDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid unit id", err) }
	update := bson.M{}
	if body.Type != nil { if *body.Type == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "type cannot be empty", nil) }; update["type"] = *body.Type }
	if body.VIN != nil { if *body.VIN == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "vin cannot be empty", nil) }; update["vin"] = *body.VIN }
	if body.Year != nil { update["year"] = *body.Year }
	if body.Make != nil { update["make"] = *body.Make }
	if body.Model != nil { update["model"] = *body.Model }
	if body.UnitNumber != nil { if *body.UnitNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "unit_number cannot be empty", nil) }; 
		if exists, err := s.repo.ExistsByUnitNumberExcept(ctx, tenantID, *body.UnitNumber, oid); err != nil { return nil, utils.Internal("CHECK_UNIQUE_FAILED", "Failed to check unit number", err) } else if exists { return nil, utils.Conflict("UNIT_NUMBER_EXISTS", "Unit number already exists", nil) }
		update["unit_number"] = *body.UnitNumber }
	if body.UnitNickname != nil { update["unit_nickname"] = *body.UnitNickname }
	if body.Fleet != nil { update["fleet"] = *body.Fleet }
	if body.LicensePlateState != nil { update["license_plate_state"] = *body.LicensePlateState }
	if body.LicensePlate != nil { update["license_plate"] = *body.LicensePlate }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("SHOPUNIT_UPDATE_FAILED", "Unable to update unit", err) }
	dto := models.ToShopUnitDTO(*updated)
	return &dto, nil
}

func (s *ShopUnitService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid unit id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("SHOPUNIT_DELETE_FAILED", "Unable to delete unit", err) }
	return nil
} 