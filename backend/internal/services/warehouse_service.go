package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WarehouseService struct {
	repo *repositories.WarehouseRepository
}

func NewWarehouseService(repo *repositories.WarehouseRepository) *WarehouseService {
	return &WarehouseService{repo: repo}
}

func (s *WarehouseService) List(ctx context.Context, page, limit int64, search string, isActive *bool, warehouseType string, tenantID string) ([]models.WarehouseDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.WarehouseListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		IsActive: isActive,
		Type:     warehouseType,
		TenantID: tenantID,
	})
	if err != nil {
		return nil, 0, utils.Internal("WAREHOUSE_LIST_FAILED", "Unable to list warehouses", err)
	}

	out := make([]models.WarehouseDTO, len(items))
	for i, warehouse := range items {
		out[i] = models.ToWarehouseDTO(warehouse)
	}

	return out, total, nil
}

func (s *WarehouseService) Get(ctx context.Context, id string, tenantID string) (*models.WarehouseDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid warehouse id", nil)
	}

	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil {
		return nil, utils.NotFound("WAREHOUSE_NOT_FOUND", "Warehouse not found", err)
	}

	dto := models.ToWarehouseDTO(*m)
	return &dto, nil
}

func (s *WarehouseService) Create(ctx context.Context, body models.WarehouseCreate, tenantID string) (*models.WarehouseDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Warehouse name is required", nil)
	}

	// Validate warehouse type
	if body.Type != "" && !s.isValidType(body.Type) {
		return nil, utils.BadRequest("INVALID_TYPE", "Invalid warehouse type. Valid types: main, store, warehouse", nil)
	}

	m := &models.Warehouse{
		TenantID: tenantID,
		Name:     body.Name,
		Address:  body.Address,
		Type:     body.Type,
		IsActive: true,
	}

	// Set default type if not provided
	if m.Type == "" {
		m.Type = models.WarehouseTypeMain
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("WAREHOUSE_CREATE_FAILED", "Unable to create warehouse", err)
	}

	dto := models.ToWarehouseDTO(*created)
	return &dto, nil
}

func (s *WarehouseService) Update(ctx context.Context, id string, body models.WarehouseUpdate, tenantID string) (*models.WarehouseDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid warehouse id", nil)
	}

	update := bson.M{}
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Warehouse name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.Address != nil {
		update["address"] = *body.Address
	}
	if body.Type != nil {
		if !s.isValidType(*body.Type) {
			return nil, utils.BadRequest("INVALID_TYPE", "Invalid warehouse type. Valid types: main, store, warehouse", nil)
		}
		update["type"] = *body.Type
	}
	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil {
		return nil, utils.Internal("WAREHOUSE_UPDATE_FAILED", "Unable to update warehouse", err)
	}

	dto := models.ToWarehouseDTO(*updated)
	return &dto, nil
}

func (s *WarehouseService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid warehouse id", nil)
	}

	// TODO: Check if warehouse has products before deletion
	// For now, we'll allow deletion

	if err := s.repo.Delete(ctx, oid, tenantID); err != nil {
		return utils.Internal("WAREHOUSE_DELETE_FAILED", "Unable to delete warehouse", err)
	}

	return nil
}

func (s *WarehouseService) isValidType(warehouseType string) bool {
	validTypes := []string{
		models.WarehouseTypeMain,
		models.WarehouseTypeStore,
		models.WarehouseTypeWarehouse,
	}

	for _, validType := range validTypes {
		if warehouseType == validType {
			return true
		}
	}
	return false
} 