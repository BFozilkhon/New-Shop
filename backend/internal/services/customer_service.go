package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CustomerService struct { repo *repositories.CustomerRepository }

func NewCustomerService(repo *repositories.CustomerRepository) *CustomerService { return &CustomerService{ repo: repo } }

func (s *CustomerService) List(ctx context.Context, page, limit int64, search, tenantID string) ([]models.CustomerDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.CustomerListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, TenantID: tenantID })
	if err != nil { return nil, 0, utils.Internal("CUSTOMER_LIST_FAILED", "Unable to list customers", err) }
	out := make([]models.CustomerDTO, len(items))
	for i, it := range items { out[i] = models.ToCustomerDTO(it) }
	return out, total, nil
}

func (s *CustomerService) Get(ctx context.Context, id string, tenantID string) (*models.CustomerDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid customer id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("CUSTOMER_NOT_FOUND", "Customer not found", err) }
	dto := models.ToCustomerDTO(*m)
	return &dto, nil
}

func (s *CustomerService) Create(ctx context.Context, body models.CustomerCreate, tenantID string) (*models.CustomerDTO, error) {
	if body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name is required", nil) }
	if body.PhoneNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "phone_number is required", nil) }
	m := &models.Customer{
		TenantID: tenantID,
		FirstName: body.FirstName,
		LastName: body.LastName,
		MiddleName: body.MiddleName,
		DateOfBirth: body.DateOfBirth,
		Gender: body.Gender,
		PhoneNumber: body.PhoneNumber,
		PrimaryLanguage: body.PrimaryLanguage,
		Address: body.Address,
		Email: body.Email,
		Telegram: body.Telegram,
		Facebook: body.Facebook,
		Instagram: body.Instagram,
	}
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("CUSTOMER_CREATE_FAILED", "Unable to create customer", err) }
	dto := models.ToCustomerDTO(*created)
	return &dto, nil
}

func (s *CustomerService) Update(ctx context.Context, id string, body models.CustomerUpdate, tenantID string) (*models.CustomerDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid customer id", err) }
	update := bson.M{}
	if body.FirstName != nil { if *body.FirstName == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "first_name cannot be empty", nil) }; update["first_name"] = *body.FirstName }
	if body.LastName != nil { update["last_name"] = *body.LastName }
	if body.MiddleName != nil { update["middle_name"] = *body.MiddleName }
	if body.DateOfBirth != nil { update["date_of_birth"] = *body.DateOfBirth }
	if body.Gender != nil { update["gender"] = *body.Gender }
	if body.PhoneNumber != nil { if *body.PhoneNumber == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "phone_number cannot be empty", nil) }; update["phone_number"] = *body.PhoneNumber }
	if body.PrimaryLanguage != nil { update["primary_language"] = *body.PrimaryLanguage }
	if body.Address != nil { update["address"] = *body.Address }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Telegram != nil { update["telegram"] = *body.Telegram }
	if body.Facebook != nil { update["facebook"] = *body.Facebook }
	if body.Instagram != nil { update["instagram"] = *body.Instagram }
	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("CUSTOMER_UPDATE_FAILED", "Unable to update customer", err) }
	dto := models.ToCustomerDTO(*updated)
	return &dto, nil
}

func (s *CustomerService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid customer id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("CUSTOMER_DELETE_FAILED", "Unable to delete customer", err) }
	return nil
} 