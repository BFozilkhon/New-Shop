package services

import (
	"context"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentService struct { repo *repositories.PaymentRepository }

func NewPaymentService(repo *repositories.PaymentRepository) *PaymentService { return &PaymentService{ repo: repo } }

type PaymentListParams = repositories.PaymentListParams

func (s *PaymentService) List(ctx context.Context, p PaymentListParams) ([]models.PaymentDTO, int64, error) {
	return s.repo.List(ctx, p)
}

func (s *PaymentService) Create(ctx context.Context, req models.PaymentCreate) (*models.Payment, error) {
	if req.Amount <= 0 { return nil, utils.BadRequest("INVALID_AMOUNT", "Amount must be positive", nil) }
	if req.Currency == "" { req.Currency = "UZS" }
	var tid primitive.ObjectID
	if req.TenantID != "" {
		id, err := primitive.ObjectIDFromHex(req.TenantID); if err != nil { return nil, utils.BadRequest("INVALID_TENANT_ID", "Invalid tenant id", err) }
		tid = id
	}
	m := &models.Payment{ TenantID: tid, Amount: req.Amount, Currency: req.Currency, Method: req.Method, Status: req.Status, Note: req.Note, Period: req.Period }
	return s.repo.Create(ctx, m)
} 