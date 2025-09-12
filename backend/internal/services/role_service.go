package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoleService struct { repo *repositories.RoleRepository }

func NewRoleService(repo *repositories.RoleRepository) *RoleService { return &RoleService{repo: repo} }

func (s *RoleService) List(ctx context.Context, page, limit int64, search string, isActive *bool) ([]models.RoleDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.RoleListParams{
		Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, IsActive: isActive,
	})
	if err != nil { return nil, 0, utils.Internal("ROLE_LIST_FAILED", "Unable to list roles", err) }
	out := make([]models.RoleDTO, len(items))
	for i, it := range items { out[i] = models.ToRoleDTO(it) }
	return out, total, nil
}

func (s *RoleService) Get(ctx context.Context, id string) (*models.RoleDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid role id", err) }
	m, err := s.repo.Get(ctx, oid)
	if err != nil { return nil, utils.NotFound("ROLE_NOT_FOUND", "Role not found", err) }
	dto := models.ToRoleDTO(*m)
	return &dto, nil
}

func (s *RoleService) Create(ctx context.Context, body models.RoleCreate) (*models.RoleDTO, error) {
	if body.Name == "" || body.Key == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Name and key are required", nil) }
	m := &models.Role{Name: body.Name, Key: body.Key, Description: body.Description, Permissions: body.Permissions, IsActive: true, IsDeleted: false}
	m, err := s.repo.Create(ctx, m)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) { return nil, utils.Conflict("ROLE_KEY_EXISTS", "Role key already exists", err) }
		return nil, utils.Internal("ROLE_CREATE_FAILED", "Unable to create role", err)
	}
	dto := models.ToRoleDTO(*m)
	return &dto, nil
}

func (s *RoleService) Update(ctx context.Context, id string, body models.RoleUpdate) (*models.RoleDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid role id", err) }
	update := bson.M{}
	if body.Name != nil { update["name"] = *body.Name }
	if body.Key != nil { update["key"] = *body.Key }
	if body.Description != nil { update["description"] = *body.Description }
	if body.Permissions != nil { update["permissions"] = *body.Permissions }
	if body.IsActive != nil { update["is_active"] = *body.IsActive }
	m, err := s.repo.Update(ctx, oid, update)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) { return nil, utils.Conflict("ROLE_KEY_EXISTS", "Role key already exists", err) }
		return nil, utils.Internal("ROLE_UPDATE_FAILED", "Unable to update role", err)
	}
	dto := models.ToRoleDTO(*m)
	return &dto, nil
}

func (s *RoleService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid role id", err) }
	if err := s.repo.SoftDelete(ctx, oid); err != nil { return utils.Internal("ROLE_DELETE_FAILED", "Unable to delete role", err) }
	return nil
}

func (s *RoleService) Permissions(ctx context.Context) ([]models.PermissionGroup, error) {
	groups := []models.PermissionGroup{
		{Key: "general", Name: "General", Items: []models.PermissionItem{{Key: "dashboard", Name: "Dashboard"}}},
		{Key: "products", Name: "Products", Items: []models.PermissionItem{
			{Key: "products.catalog", Name: "Catalog"},
			{Key: "products.categories", Name: "Categories"},
			{Key: "products.attributes", Name: "Attributes"},
			{Key: "products.characteristics", Name: "Characteristics"},
			{Key: "products.brands", Name: "Brands"},
			{Key: "products.warehouses", Name: "Warehouses"},
			{Key: "products.parameters", Name: "Parameters"},
			{Key: "products.import", Name: "Import"},
			{Key: "products.orders", Name: "Orders"},
			{Key: "products.inventory", Name: "Inventory"},
			{Key: "products.transfer", Name: "Transfer"},
			{Key: "products.repricing", Name: "Repricing"},
			{Key: "products.writeoff", Name: "Write-Off"},
			{Key: "products.suppliers", Name: "Suppliers"},
		}},
		{Key: "sales", Name: "Sales", Items: []models.PermissionItem{
			{Key: "sales.new", Name: "New Sale"},
			{Key: "sales.all", Name: "All Sales"},
			{Key: "sales.cashbox.shifts", Name: "Cashbox shifts"},
			{Key: "sales.cashbox.operations", Name: "Cashbox operations"},
		}},
		{Key: "customers", Name: "Customers", Items: []models.PermissionItem{
			{Key: "customers.list", Name: "Customers List"},
			{Key: "customers.groups", Name: "Customer groups"},
			{Key: "customers.loyalty", Name: "Loyalty program"},
			{Key: "customers.debts", Name: "Customers' debts"},
		}},
		{Key: "crm", Name: "CRM", Items: []models.PermissionItem{
			{Key: "crm.leads", Name: "Leads"},
			{Key: "crm.deals", Name: "Deals"},
			{Key: "crm.events", Name: "Events"},
			{Key: "crm.calendar", Name: "Calendar"},
			{Key: "crm.auto", Name: "Auto Responder"},
			{Key: "crm.contacts", Name: "Contacts"},
		}},
		{Key: "marketing", Name: "Marketing", Items: []models.PermissionItem{
			{Key: "marketing.promotion", Name: "Promotion"},
			{Key: "marketing.promocodes", Name: "Promo codes"},
			{Key: "marketing.sms", Name: "SMS mailing"},
			{Key: "marketing.giftcards", Name: "Gift Cards"},
		}},
		{Key: "shop", Name: "Shop", Items: []models.PermissionItem{
			{Key: "shop.service", Name: "Shop Service"},
			{Key: "shop.unit", Name: "Shop Unit"},
			{Key: "shop.customer", Name: "Shop Customer"},
			{Key: "shop.vendor", Name: "Shop Vendor"},
		}},
		{Key: "reports", Name: "Reports", Items: []models.PermissionItem{
			{Key: "reports.fav", Name: "Favourites"},
			{Key: "reports.shop", Name: "Shop"},
			{Key: "reports.products", Name: "Products"},
			{Key: "reports.sellers", Name: "Sellers"},
			{Key: "reports.customers", Name: "Customers"},
			{Key: "reports.leads", Name: "Leads"},
			{Key: "reports.deals", Name: "Deals"},
			{Key: "reports.finance", Name: "Finance"},
		}},
		{Key: "finance", Name: "Finance", Items: []models.PermissionItem{
			{Key: "finance.categories", Name: "Finance Categories"},
			{Key: "finance.transactions", Name: "Financial transactions"},
			{Key: "finance.accounts", Name: "State of accounts"},
		}},
		{Key: "hr", Name: "HR Management", Items: []models.PermissionItem{{Key: "hr.users", Name: "Employees"}, {Key: "hr.roles", Name: "Roles"}}},
		{Key: "settings", Name: "Settings", Items: []models.PermissionItem{
			{Key: "settings.profile", Name: "Profile"},
			{Key: "settings.integrations", Name: "Integrations"},
			{Key: "settings.company", Name: "Company"},
			{Key: "settings.stores", Name: "Stores"},
			{Key: "settings.tariff", Name: "Tariff"},
			{Key: "settings.receipts", Name: "Receipts"},
			{Key: "settings.payments", Name: "Currencies and payments"},
			{Key: "settings.products", Name: "Products"},
			{Key: "settings.notifications", Name: "Notifications"},
			{Key: "settings.pricetags", Name: "Price Tags"},
		}},
	}
	return groups, nil
} 