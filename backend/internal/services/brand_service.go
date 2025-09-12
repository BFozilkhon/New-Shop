package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BrandService struct {
	repo *repositories.BrandRepository
}

func NewBrandService(repo *repositories.BrandRepository) *BrandService {
	return &BrandService{repo: repo}
}

func (s *BrandService) List(ctx context.Context, page, limit int64, search string, isActive *bool, tenantID string) ([]models.BrandDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.BrandListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		IsActive: isActive,
		TenantID: tenantID,
	})
	if err != nil {
		return nil, 0, utils.Internal("BRAND_LIST_FAILED", "Unable to list brands", err)
	}

	out := make([]models.BrandDTO, len(items))
	for i, brand := range items {
		out[i] = models.ToBrandDTO(brand)
	}

	return out, total, nil
}

func (s *BrandService) Get(ctx context.Context, id string, tenantID string) (*models.BrandDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid brand id", nil)
	}

	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil {
		return nil, utils.NotFound("BRAND_NOT_FOUND", "Brand not found", err)
	}

	dto := models.ToBrandDTO(*m)
	return &dto, nil
}

func (s *BrandService) Create(ctx context.Context, body models.BrandCreate, tenantID string) (*models.BrandDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Brand name is required", nil)
	}

	m := &models.Brand{
		TenantID:    tenantID,
		Name:        body.Name,
		Description: body.Description,
		Logo:        body.Logo,
		Images:      body.Images,
		Website:     body.Website,
		IsActive:    true,
	}

	if m.Images == nil {
		m.Images = []map[string]interface{}{}
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("BRAND_CREATE_FAILED", "Unable to create brand", err)
	}

	dto := models.ToBrandDTO(*created)
	return &dto, nil
}

func (s *BrandService) Update(ctx context.Context, id string, body models.BrandUpdate, tenantID string) (*models.BrandDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid brand id", nil)
	}

	update := bson.M{}
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Brand name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.Description != nil {
		update["description"] = *body.Description
	}
	if body.Logo != nil {
		update["logo"] = *body.Logo
	}
	if body.Images != nil {
		update["images"] = body.Images
	}
	if body.Website != nil {
		update["website"] = *body.Website
	}
	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil {
		return nil, utils.Internal("BRAND_UPDATE_FAILED", "Unable to update brand", err)
	}

	dto := models.ToBrandDTO(*updated)
	return &dto, nil
}

func (s *BrandService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid brand id", nil)
	}

	// Check if brand has products (you would implement this check with product repository)
	// For now, we'll allow deletion

	if err := s.repo.Delete(ctx, oid, tenantID); err != nil {
		return utils.Internal("BRAND_DELETE_FAILED", "Unable to delete brand", err)
	}

	return nil
} 