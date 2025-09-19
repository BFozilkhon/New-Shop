package services

import (
	"context"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
)

type ExchangeRateService struct { repo *repositories.ExchangeRateRepository }

func NewExchangeRateService(repo *repositories.ExchangeRateRepository) *ExchangeRateService { return &ExchangeRateService{repo: repo} }

func (s *ExchangeRateService) List(ctx context.Context, tenantID string, page, limit int64) ([]models.ExchangeRateDTO, int64, error) {
	items, total, err := s.repo.List(ctx, tenantID, page, limit)
	if err != nil { return nil, 0, utils.Internal("RATES_LIST_FAILED", "Unable to list exchange rates", err) }
	out := make([]models.ExchangeRateDTO, len(items))
	for i, it := range items { out[i] = models.ExchangeRateDTO{ ID: it.ID, Rate: it.Rate, StartAt: it.StartAt, EndAt: it.EndAt } }
	return out, total, nil
}

func (s *ExchangeRateService) Create(ctx context.Context, tenantID string, body models.ExchangeRateCreate, createdBy string) (*models.ExchangeRateDTO, error) {
	rate := int(body.Rate)
	if rate <= 0 { return nil, utils.BadRequest("INVALID_RATE", "Rate must be positive", nil) }
	start := time.Now().UTC()
	if body.StartAt != nil { start = body.StartAt.UTC() }
	// close previous open period
	if err := s.repo.CloseOpenPeriod(ctx, tenantID, start); err != nil { return nil, utils.Internal("RATES_CLOSE_PREV_FAILED", "Unable to close previous rate period", err) }
	m, err := s.repo.Create(ctx, tenantID, rate, start, createdBy)
	if err != nil { return nil, utils.Internal("RATES_CREATE_FAILED", "Unable to create exchange rate", err) }
	dto := &models.ExchangeRateDTO{ ID: m.ID, Rate: m.Rate, StartAt: m.StartAt, EndAt: m.EndAt }
	return dto, nil
}

func (s *ExchangeRateService) GetAt(ctx context.Context, tenantID string, t time.Time) (*models.ExchangeRateDTO, error) {
	m, err := s.repo.FindActiveAt(ctx, tenantID, t)
	if err != nil { return nil, utils.NotFound("RATE_NOT_FOUND", "Exchange rate not found for date", err) }
	dto := &models.ExchangeRateDTO{ ID: m.ID, Rate: m.Rate, StartAt: m.StartAt, EndAt: m.EndAt }
	return dto, nil
} 