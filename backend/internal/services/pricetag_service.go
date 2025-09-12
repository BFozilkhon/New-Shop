package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PriceTagService struct { repo *repositories.PriceTagRepository }

func NewPriceTagService(repo *repositories.PriceTagRepository) *PriceTagService { return &PriceTagService{ repo: repo } }

func (s *PriceTagService) List(ctx context.Context, tenantID string, page, limit int64, search string) ([]models.PriceTagTemplate, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.PriceTagListParams{ TenantID: tenantID, Page: page, Limit: limit, Search: search })
	if err != nil { return nil, 0, utils.Internal("PRICETAG_LIST_FAILED", "Unable to list price tag templates", err) }
	return items, total, nil
}

func (s *PriceTagService) Get(ctx context.Context, id string, tenantID string) (*models.PriceTagTemplate, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", nil) }
	m, err := s.repo.Get(ctx, oid, tenantID); if err != nil { return nil, utils.NotFound("PRICETAG_NOT_FOUND", "Template not found", err) }
	return m, nil
}

func (s *PriceTagService) Create(ctx context.Context, body models.PriceTagTemplateCreate, tenantID string) (*models.PriceTagTemplate, error) {
	if body.Name == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Name is required", nil) }
	if body.WidthMM <= 0 || body.HeightMM <= 0 { return nil, utils.BadRequest("VALIDATION_ERROR", "Width and Height must be positive", nil) }
	if body.BarcodeFmt != "CODE128" && body.BarcodeFmt != "EAN13" { return nil, utils.BadRequest("INVALID_BARCODE", "Barcode format must be CODE128 or EAN13", nil) }
	m := &models.PriceTagTemplate{ TenantID: tenantID, Name: body.Name, WidthMM: body.WidthMM, HeightMM: body.HeightMM, BarcodeFmt: body.BarcodeFmt, Properties: body.Properties }
	created, err := s.repo.Create(ctx, m); if err != nil { return nil, utils.Internal("PRICETAG_CREATE_FAILED", "Unable to create template", err) }
	return created, nil
}

func (s *PriceTagService) Update(ctx context.Context, id string, body models.PriceTagTemplateUpdate, tenantID string) (*models.PriceTagTemplate, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid id", nil) }
	update := bson.M{}
	if body.Name != nil { update["name"] = *body.Name }
	if body.WidthMM != nil { update["width_mm"] = *body.WidthMM }
	if body.HeightMM != nil { update["height_mm"] = *body.HeightMM }
	if body.BarcodeFmt != nil { if *body.BarcodeFmt != "CODE128" && *body.BarcodeFmt != "EAN13" { return nil, utils.BadRequest("INVALID_BARCODE", "Barcode format must be CODE128 or EAN13", nil) }; update["barcode_fmt"] = *body.BarcodeFmt }
	if body.Properties != nil { update["properties"] = *body.Properties }
	m, err := s.repo.Update(ctx, oid, tenantID, update); if err != nil { return nil, utils.Internal("PRICETAG_UPDATE_FAILED", "Unable to update template", err) }
	return m, nil
}

func (s *PriceTagService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return utils.BadRequest("INVALID_ID", "Invalid id", nil) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("PRICETAG_DELETE_FAILED", "Unable to delete template", err) }
	return nil
} 