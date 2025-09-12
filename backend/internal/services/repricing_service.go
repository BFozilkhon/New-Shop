package services

import (
	"context"
	"math/rand"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RepricingService struct {
	repo *repositories.RepricingRepository
	store *repositories.StoreRepository
	product *repositories.ProductRepository
}

func NewRepricingService(repo *repositories.RepricingRepository, store *repositories.StoreRepository, product *repositories.ProductRepository) *RepricingService { return &RepricingService{repo: repo, store: store, product: product} }

func (s *RepricingService) List(ctx context.Context, p repositories.RepricingListParams) ([]models.Repricing, int64, error) {
	items, total, err := s.repo.List(ctx, p)
	if err != nil { return nil, 0, utils.Internal("REPRICING_LIST_FAILED", "Unable to list repricings", err) }
	return items, total, nil
}

func (s *RepricingService) Get(ctx context.Context, id string, tenantID string) (*models.Repricing, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid repricing id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("REPRICING_NOT_FOUND", "Repricing not found", err) }
	return m, nil
}

func (s *RepricingService) Create(ctx context.Context, body models.CreateRepricingRequest, tenantID string, createdBy models.InventoryUser) (*models.Repricing, error) {
	if body.Name == "" || body.ShopID == "" || body.Type == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Name, shop and type are required", nil) }
	shopName := ""
	if st, err := s.store.GetByIDHex(ctx, body.ShopID, tenantID); err == nil { shopName = st.Title }
	m := &models.Repricing{ TenantID: tenantID, ExternalID: generateExternalIDRepricing(), Name: body.Name, ShopID: body.ShopID, ShopName: shopName, FromFile: body.FromFile, Type: body.Type, Status: "NEW", CreatedBy: createdBy, Items: []models.RepricingItem{} }
	m, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("REPRICING_CREATE_FAILED", "Unable to create repricing", err) }
	return m, nil
}

func (s *RepricingService) Update(ctx context.Context, id string, body models.UpdateRepricingRequest, tenantID string, actor models.InventoryUser) (*models.Repricing, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid repricing id", err) }
	update := bson.M{}
	if body.Name != "" { update["name"] = body.Name }

	var preparedItems []models.RepricingItem
	if body.Items != nil {
		items := make([]models.RepricingItem, 0, len(body.Items))
		total := 0.0
		count := 0
		for _, it := range body.Items {
			pid, err := primitive.ObjectIDFromHex(it.ProductID); if err != nil { return nil, utils.BadRequest("INVALID_PRODUCT_ID", "Invalid product id in items", err) }
			// ensure product exists
			if _, err := s.product.Get(ctx, pid, tenantID); err != nil {
				if _, e2 := s.product.GetByID(ctx, pid); e2 != nil { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for repricing", err) }
			}
			items = append(items, models.RepricingItem{ ProductID: pid, ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: it.Barcode, Currency: it.Currency, SupplyPrice: it.SupplyPrice, RetailPrice: it.RetailPrice, Qty: it.Qty })
			total += it.RetailPrice * it.Qty
			count++
		}
		preparedItems = items
		update["items"] = items
		update["total"] = total
		update["total_items_count"] = count
	}

	if body.Action == "approve" || body.Action == "reject" {
		cur, err := s.repo.Get(ctx, oid, tenantID)
		if err != nil { return nil, utils.NotFound("REPRICING_NOT_FOUND", "Repricing not found", err) }
		if body.Action == "approve" && cur.Status == "NEW" {
			// if items were provided in the same request, apply only those; otherwise apply current stored items
			selected := preparedItems
			if len(selected) == 0 { selected = cur.Items }
			for _, it := range selected {
				p, err := s.product.Get(ctx, it.ProductID, tenantID); if err != nil { if p2, e2 := s.product.GetByID(ctx, it.ProductID); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for repricing", err) } }
				if err := s.product.UpdatePrices(ctx, p.ID, p.TenantID, it.SupplyPrice, it.RetailPrice); err != nil { return nil, utils.Internal("PRODUCT_PRICE_UPDATE_FAILED", "Failed to update product prices", err) }
			}
			update["status"] = "APPROVED"
			now := time.Now().UTC(); update["finished_at"] = now; update["finished_by"] = actor
		}
		if body.Action == "reject" && cur.Status == "NEW" {
			update["status"] = "REJECTED"
			now := time.Now().UTC(); update["finished_at"] = now; update["finished_by"] = actor
		}
	}

	m, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("REPRICING_UPDATE_FAILED", "Unable to update repricing", err) }
	return m, nil
}

func (s *RepricingService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid repricing id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("REPRICING_DELETE_FAILED", "Unable to delete repricing", err) }
	return nil
}

func generateExternalIDRepricing() int64 {
	rand.Seed(time.Now().UnixNano())
	return 100000 + int64(rand.Intn(900000))
} 