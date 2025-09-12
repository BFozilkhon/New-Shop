package services

import (
	"context"
	"shop/backend/internal/repositories"
)

type StatsService struct { repo *repositories.StatsRepository }

func NewStatsService(repo *repositories.StatsRepository) *StatsService { return &StatsService{ repo: repo } }

type StatsSummary struct {
	ActiveTenants int64   `json:"active_tenants"`
	Users         int64   `json:"users"`
	Revenue       float64 `json:"revenue"`
	ARPU          float64 `json:"arpu"`
}

func (s *StatsService) Summary(ctx context.Context) (*StatsSummary, error) {
	tenants, err := s.repo.CountActiveTenants(ctx); if err != nil { return nil, err }
	users, err := s.repo.CountUsers(ctx); if err != nil { return nil, err }
	revenue, err := s.repo.SumPayments(ctx); if err != nil { return nil, err }
	arpu := 0.0
	if tenants > 0 { arpu = revenue / float64(tenants) }
	return &StatsSummary{ ActiveTenants: tenants, Users: users, Revenue: revenue, ARPU: arpu }, nil
}

type MonthlyPoint = repositories.MonthlyPoint

func (s *StatsService) MonthlyRevenue(ctx context.Context, months int) ([]MonthlyPoint, error) {
	return s.repo.MonthlyPayments(ctx, months)
} 