package services

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
)

type LeadService struct {
	repo *repositories.LeadRepository
}

func NewLeadService(repo *repositories.LeadRepository) *LeadService { return &LeadService{repo: repo} }

func (s *LeadService) Repo() *repositories.LeadRepository { return s.repo }

func (s *LeadService) List(ctx context.Context, tenantID primitive.ObjectID, filter bson.M, page, limit int64, sort bson.D) ([]models.LeadDTO, int64, error) {
	items, total, err := s.repo.List(ctx, tenantID, filter, page, limit, sort)
	if err != nil { return nil, 0, err }
	var res []models.LeadDTO
	for _, it := range items {
		dto := models.LeadDTO{
			ID: it.ID.Hex(),
			Title: it.Title,
			Name: it.Name,
			Description: it.Description,
			Company: it.Company,
			CompanyName: it.CompanyName,
			CustomerName: it.CustomerName,
			ContactName: it.ContactName,
			ContactEmail: it.ContactEmail,
			ContactPhone: it.ContactPhone,
			Contacts: it.Contacts,
			Amount: it.Amount,
			Price: it.Price,
			Currency: it.Currency,
			Status: it.Status,
			Stage: it.Stage,
			Priority: it.Priority,
			PriorityInt: it.PriorityInt,
			Probability: it.Probability,
			Source: it.Source,
			SourceDetails: it.SourceDetails,
			ExpectedCloseDate: it.ExpectedCloseDate,
			ClosingDate: it.ClosingDate,
			CreatedAt: it.CreatedAt,
			UpdatedAt: it.UpdatedAt,
			Notes: it.Notes,
			Tags: it.Tags,
			CustomFields: it.CustomFields,
		}
		res = append(res, dto)
	}
	return res, total, nil
}

func (s *LeadService) Get(ctx context.Context, id string) (*models.LeadDTO, error) {
	it, err := s.repo.Get(ctx, id)
	if err != nil { return nil, err }
	dto := models.LeadDTO{
		ID: it.ID.Hex(),
		Title: it.Title,
		Name: it.Name,
		Description: it.Description,
		Company: it.Company,
		CompanyName: it.CompanyName,
		CustomerName: it.CustomerName,
		ContactName: it.ContactName,
		ContactEmail: it.ContactEmail,
		ContactPhone: it.ContactPhone,
		Contacts: it.Contacts,
		Amount: it.Amount,
		Price: it.Price,
		Currency: it.Currency,
		Status: it.Status,
		Stage: it.Stage,
		Priority: it.Priority,
		PriorityInt: it.PriorityInt,
		Probability: it.Probability,
		Source: it.Source,
		SourceDetails: it.SourceDetails,
		ExpectedCloseDate: it.ExpectedCloseDate,
		ClosingDate: it.ClosingDate,
		CreatedAt: it.CreatedAt,
		UpdatedAt: it.UpdatedAt,
		Notes: it.Notes,
		Tags: it.Tags,
		CustomFields: it.CustomFields,
	}
	return &dto, nil
}

func (s *LeadService) Create(ctx context.Context, tenantID primitive.ObjectID, in models.LeadCreate) (*models.LeadDTO, error) {
	lead, err := s.repo.Create(ctx, tenantID, in)
	if err != nil { return nil, err }
	dto := models.LeadDTO{
		ID: lead.ID.Hex(),
		Title: lead.Title,
		Name: lead.Name,
		Description: lead.Description,
		Company: lead.Company,
		CompanyName: lead.CompanyName,
		CustomerName: lead.CustomerName,
		ContactName: lead.ContactName,
		ContactEmail: lead.ContactEmail,
		ContactPhone: lead.ContactPhone,
		Contacts: lead.Contacts,
		Amount: lead.Amount,
		Price: lead.Price,
		Currency: lead.Currency,
		Status: lead.Status,
		Stage: lead.Stage,
		Priority: lead.Priority,
		PriorityInt: lead.PriorityInt,
		Probability: lead.Probability,
		Source: lead.Source,
		SourceDetails: lead.SourceDetails,
		ExpectedCloseDate: lead.ExpectedCloseDate,
		ClosingDate: lead.ClosingDate,
		CreatedAt: lead.CreatedAt,
		UpdatedAt: lead.UpdatedAt,
		Notes: lead.Notes,
		Tags: lead.Tags,
		CustomFields: lead.CustomFields,
	}
	return &dto, nil
}

func (s *LeadService) Update(ctx context.Context, id string, in models.LeadUpdate) (*models.LeadDTO, error) {
	lead, err := s.repo.Update(ctx, id, in)
	if err != nil { return nil, err }
	dto := models.LeadDTO{
		ID: lead.ID.Hex(),
		Title: lead.Title,
		Name: lead.Name,
		Description: lead.Description,
		Company: lead.Company,
		CompanyName: lead.CompanyName,
		CustomerName: lead.CustomerName,
		ContactName: lead.ContactName,
		ContactEmail: lead.ContactEmail,
		ContactPhone: lead.ContactPhone,
		Contacts: lead.Contacts,
		Amount: lead.Amount,
		Price: lead.Price,
		Currency: lead.Currency,
		Status: lead.Status,
		Stage: lead.Stage,
		Priority: lead.Priority,
		PriorityInt: lead.PriorityInt,
		Probability: lead.Probability,
		Source: lead.Source,
		SourceDetails: lead.SourceDetails,
		ExpectedCloseDate: lead.ExpectedCloseDate,
		ClosingDate: lead.ClosingDate,
		CreatedAt: lead.CreatedAt,
		UpdatedAt: lead.UpdatedAt,
		Notes: lead.Notes,
		Tags: lead.Tags,
		CustomFields: lead.CustomFields,
	}
	return &dto, nil
}

func (s *LeadService) UpdateStatus(ctx context.Context, id string, status string) error { return s.repo.UpdateStatus(ctx, id, status) }

func (s *LeadService) BulkUpdate(ctx context.Context, ids []string, update map[string]interface{}) error {
	if update == nil { update = map[string]interface{}{} }
	return s.repo.BulkUpdate(ctx, ids, bson.M(update))
}

func (s *LeadService) GetStages(ctx context.Context, tenantID primitive.ObjectID) ([]models.PipelineStage, error) { return s.repo.GetStages(ctx, tenantID) }

func (s *LeadService) CreateStage(ctx context.Context, tenantID primitive.ObjectID, key, title string, order int) error {
    return s.repo.CreateStage(ctx, tenantID, key, title, order)
}

func (s *LeadService) ReorderStages(ctx context.Context, tenantID primitive.ObjectID, keys []string) error {
    return s.repo.ReorderStages(ctx, tenantID, keys)
}

func (s *LeadService) DeleteStage(ctx context.Context, tenantID primitive.ObjectID, key string) error {
    return s.repo.DeleteStage(ctx, tenantID, key)
} 