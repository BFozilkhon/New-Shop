package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ParameterService struct {
	repo *repositories.ParameterRepository
}

func NewParameterService(repo *repositories.ParameterRepository) *ParameterService {
	return &ParameterService{repo: repo}
}

func (s *ParameterService) List(ctx context.Context, page, limit int64, search string, paramType, status, category string, required *bool, tenantID string) ([]models.ParameterDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ParameterListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		Type:     paramType,
		Status:   status,
		Category: category,
		Required: required,
		TenantID: tenantID,
	})
	if err != nil {
		return nil, 0, utils.Internal("PARAMETER_LIST_FAILED", "Unable to list parameters", err)
	}

	out := make([]models.ParameterDTO, len(items))
	for i, param := range items {
		out[i] = models.ToParameterDTO(param)
	}

	return out, total, nil
}

func (s *ParameterService) Get(ctx context.Context, id string, tenantID string) (*models.ParameterDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid parameter id", nil)
	}

	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil {
		return nil, utils.NotFound("PARAMETER_NOT_FOUND", "Parameter not found", err)
	}

	dto := models.ToParameterDTO(*m)
	return &dto, nil
}

func (s *ParameterService) Create(ctx context.Context, body models.ParameterCreate, tenantID string) (*models.ParameterDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Parameter name is required", nil)
	}
	if body.Type == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Parameter type is required", nil)
	}

	// Validate parameter type
	if !s.isValidType(body.Type) {
		return nil, utils.BadRequest("INVALID_TYPE", "Invalid parameter type. Valid types: text, number, boolean, select", nil)
	}

	// Validate select type has values
	if body.Type == models.ParameterTypeSelect && len(body.Values) == 0 {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Select type parameters must have values", nil)
	}

	m := &models.Parameter{
		TenantID: tenantID,
		Name:     body.Name,
		Type:     body.Type,
		Values:   body.Values,
		Unit:     body.Unit,
		Required: body.Required,
		Status:   body.Status,
		Category: body.Category,
	}

	// Set default status if not provided
	if m.Status == "" {
		m.Status = models.ParameterStatusActive
	}

	// Initialize empty values slice for non-select types
	if m.Values == nil {
		m.Values = []string{}
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("PARAMETER_CREATE_FAILED", "Unable to create parameter", err)
	}

	dto := models.ToParameterDTO(*created)
	return &dto, nil
}

func (s *ParameterService) Update(ctx context.Context, id string, body models.ParameterUpdate, tenantID string) (*models.ParameterDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid parameter id", nil)
	}

	update := bson.M{}
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Parameter name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.Type != nil {
		if !s.isValidType(*body.Type) {
			return nil, utils.BadRequest("INVALID_TYPE", "Invalid parameter type. Valid types: text, number, boolean, select", nil)
		}
		update["type"] = *body.Type
	}
	if body.Values != nil {
		update["values"] = body.Values
	}
	if body.Unit != nil {
		update["unit"] = *body.Unit
	}
	if body.Required != nil {
		update["required"] = *body.Required
	}
	if body.Status != nil {
		if !s.isValidStatus(*body.Status) {
			return nil, utils.BadRequest("INVALID_STATUS", "Invalid parameter status. Valid statuses: active, inactive", nil)
		}
		update["status"] = *body.Status
	}
	if body.Category != nil {
		update["category"] = *body.Category
	}

	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil {
		return nil, utils.Internal("PARAMETER_UPDATE_FAILED", "Unable to update parameter", err)
	}

	dto := models.ToParameterDTO(*updated)
	return &dto, nil
}

func (s *ParameterService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid parameter id", nil)
	}

	// TODO: Check if parameter is used in products before deletion
	// For now, we'll allow deletion

	if err := s.repo.Delete(ctx, oid, tenantID); err != nil {
		return utils.Internal("PARAMETER_DELETE_FAILED", "Unable to delete parameter", err)
	}

	return nil
}

func (s *ParameterService) isValidType(paramType string) bool {
	validTypes := []string{
		models.ParameterTypeText,
		models.ParameterTypeNumber,
		models.ParameterTypeBoolean,
		models.ParameterTypeSelect,
	}

	for _, validType := range validTypes {
		if paramType == validType {
			return true
		}
	}
	return false
}

func (s *ParameterService) isValidStatus(status string) bool {
	validStatuses := []string{
		models.ParameterStatusActive,
		models.ParameterStatusInactive,
	}

	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
} 