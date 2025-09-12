package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AttributeService struct {
	repo *repositories.AttributeRepository
}

func NewAttributeService(repo *repositories.AttributeRepository) *AttributeService {
	return &AttributeService{repo: repo}
}

func (s *AttributeService) List(ctx context.Context, page, limit int64, search string, isActive *bool) ([]models.AttributeDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.AttributeListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		IsActive: isActive,
	})
	if err != nil {
		return nil, 0, utils.Internal("ATTRIBUTE_LIST_FAILED", "Unable to list attributes", err)
	}

	out := make([]models.AttributeDTO, len(items))
	for i, attr := range items {
		out[i] = models.ToAttributeDTO(attr)
	}

	return out, total, nil
}

func (s *AttributeService) Get(ctx context.Context, id string) (*models.AttributeDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid attribute id", nil)
	}

	m, err := s.repo.Get(ctx, oid)
	if err != nil {
		return nil, utils.NotFound("ATTRIBUTE_NOT_FOUND", "Attribute not found", err)
	}

	dto := models.ToAttributeDTO(*m)
	return &dto, nil
}

func (s *AttributeService) Create(ctx context.Context, body models.AttributeCreate) (*models.AttributeDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Attribute name is required", nil)
	}
	if body.Value == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Attribute value is required", nil)
	}

	m := &models.Attribute{
		Name:      body.Name,
		Value:     body.Value,
		IsActive:  true,
		IsDeleted: false,
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("ATTRIBUTE_CREATE_FAILED", "Unable to create attribute", err)
	}

	dto := models.ToAttributeDTO(*created)
	return &dto, nil
}

func (s *AttributeService) Update(ctx context.Context, id string, body models.AttributeUpdate) (*models.AttributeDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid attribute id", nil)
	}

	update := bson.M{}
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Attribute name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.Value != nil {
		if *body.Value == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Attribute value cannot be empty", nil)
		}
		update["value"] = *body.Value
	}
	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, update)
	if err != nil {
		return nil, utils.Internal("ATTRIBUTE_UPDATE_FAILED", "Unable to update attribute", err)
	}

	dto := models.ToAttributeDTO(*updated)
	return &dto, nil
}

func (s *AttributeService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid attribute id", nil)
	}

	if err := s.repo.Delete(ctx, oid); err != nil {
		return utils.Internal("ATTRIBUTE_DELETE_FAILED", "Unable to delete attribute", err)
	}

	return nil
} 