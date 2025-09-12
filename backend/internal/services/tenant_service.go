package services

import (
	"context"
	"time"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TenantService struct { repo *repositories.TenantRepository }

func NewTenantService(repo *repositories.TenantRepository) *TenantService { return &TenantService{repo: repo} }

func (s *TenantService) List(ctx context.Context, page, limit int64, search string) ([]models.Tenant, int64, error) {
	return s.repo.List(ctx, page, limit, search)
}

func (s *TenantService) Get(ctx context.Context, id string) (*models.Tenant, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid tenant id", err) }
	return s.repo.Get(ctx, oid)
}

func (s *TenantService) Create(ctx context.Context, t models.Tenant) (*models.Tenant, error) {
	if !models.ValidateSubdomain(t.Subdomain) { return nil, utils.BadRequest("INVALID_SUBDOMAIN", "Invalid subdomain", nil) }
	if t.Status == "" { t.Status = models.TenantStatusTrial }
	if t.Plan == "" { t.Plan = models.PlanStarter }
	return s.repo.Create(ctx, &t)
}

func (s *TenantService) Update(ctx context.Context, id string, t models.Tenant) (*models.Tenant, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid tenant id", err) }
	update := map[string]interface{}{}
	if t.Subdomain != "" { if !models.ValidateSubdomain(t.Subdomain) { return nil, utils.BadRequest("INVALID_SUBDOMAIN", "Invalid subdomain", nil) }; update["subdomain"] = t.Subdomain }
	if t.CompanyName != "" { update["company_name"] = t.CompanyName }
	if t.Email != "" { update["email"] = t.Email }
	if t.Phone != "" { update["phone"] = t.Phone }
	if t.Status != "" { update["status"] = t.Status }
	if t.Plan != "" { update["plan"] = t.Plan }
	if t.Settings.Language != "" || t.Settings.Timezone != "" || t.Settings.Currency != "" { update["settings"] = t.Settings }
	return s.repo.Update(ctx, oid, update)
}

func (s *TenantService) SetStatus(ctx context.Context, id string, status models.TenantStatus) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid tenant id", err) }
	_, err = s.repo.Update(ctx, oid, map[string]interface{}{"status": status})
	return err
}

type TenantStats struct {
	ActiveUsers int     `json:"active_users"`
	Revenue     float64 `json:"revenue"`
	ARPU        float64 `json:"arpu"`
	Orders      int     `json:"orders"`
}

func (s *TenantService) Stats(ctx context.Context, id string) (*TenantStats, error) {
	// Minimal placeholder impl; aggregate from collections quickly
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid tenant id", err) }
	_ = oid
	// TODO: real aggregation; return zeros for now with timestamps to avoid nil
	_ = time.Now()
	return &TenantStats{ActiveUsers: 0, Revenue: 0, ARPU: 0, Orders: 0}, nil
} 