package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ImportHistoryService struct { repo *repositories.ImportHistoryRepository }

func NewImportHistoryService(repo *repositories.ImportHistoryRepository) *ImportHistoryService { return &ImportHistoryService{repo: repo} }

func (s *ImportHistoryService) List(ctx context.Context, tenantID string, page, limit int64, storeIDStr string) ([]models.ImportHistoryDTO, int64, error) {
	if tenantID == "" { return nil, 0, utils.BadRequest("TENANT_REQUIRED", "Tenant is required", nil) }
	oid, err := primitive.ObjectIDFromHex(tenantID)
	if err != nil { return nil, 0, utils.BadRequest("INVALID_TENANT", "Invalid tenant", err) }
	var storeOID *primitive.ObjectID
	if storeIDStr != "" {
		if so, err := primitive.ObjectIDFromHex(storeIDStr); err == nil { storeOID = &so }
	}
	items, total, err := s.repo.List(ctx, repositories.ImportHistoryListParams{ TenantID: oid, Page: page, Limit: limit, StoreID: storeOID })
	if err != nil { return nil, 0, utils.Internal("IMPORT_HISTORY_LIST_FAILED", "Unable to list import history", err) }
	out := make([]models.ImportHistoryDTO, len(items))
	for i, it := range items { out[i] = models.ToImportHistoryDTO(it) }
	return out, total, nil
}

func (s *ImportHistoryService) Create(ctx context.Context, tenantID, userID string, body models.CreateImportHistoryRequest) (*models.ImportHistoryDTO, error) {
	if tenantID == "" { return nil, utils.BadRequest("TENANT_REQUIRED", "Tenant is required", nil) }
	toid, err := primitive.ObjectIDFromHex(tenantID)
	if err != nil { return nil, utils.BadRequest("INVALID_TENANT", "Invalid tenant", err) }
	var uoid primitive.ObjectID
	if userID != "" { if id, err2 := primitive.ObjectIDFromHex(userID); err2 == nil { uoid = id } }
	var soid primitive.ObjectID
	if body.StoreID != "" { if id, err2 := primitive.ObjectIDFromHex(body.StoreID); err2 == nil { soid = id } }
	m := &models.ImportHistory{ TenantID: toid, UserID: uoid, FileName: body.FileName, StoreID: soid, StoreName: body.StoreName, TotalRows: body.TotalRows, SuccessRows: body.SuccessRows, ErrorRows: body.ErrorRows, Status: body.Status }
	m, err = s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("IMPORT_HISTORY_CREATE_FAILED", "Unable to create import history", err) }
	dto := models.ToImportHistoryDTO(*m)
	return &dto, nil
} 