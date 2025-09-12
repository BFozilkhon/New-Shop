package services

import (
	"context"
	"math/rand"
	"strings"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TransferService struct {
	repo    *repositories.TransferRepository
	stores  *repositories.StoreRepository
	product *repositories.ProductRepository
}

func NewTransferService(repo *repositories.TransferRepository, stores *repositories.StoreRepository, product *repositories.ProductRepository) *TransferService {
	return &TransferService{repo: repo, stores: stores, product: product}
}

func (s *TransferService) List(ctx context.Context, f models.TransferFilterRequest, tenantID string) ([]models.Transfer, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.TransferListParams{
		TenantID: tenantID,
		Page: int64(ifZeroInt(f.Page, 1)),
		Limit: int64(ifZeroInt(f.Limit, 20)),
		Sort: bson.D{{Key: sortField(f.SortBy, "created_at"), Value: sortOrderValue(f.SortOrder)}},
		Search: f.Search,
		DepartureShopID: f.DepartureShopID,
		ArrivalShopID: f.ArrivalShopID,
		Status: f.Status,
		DateFrom: f.DateFrom,
		DateTo: f.DateTo,
	})
	if err != nil { return nil, 0, utils.Internal("TRANSFER_LIST_FAILED", "Unable to list transfers", err) }
	return items, total, nil
}

func (s *TransferService) Get(ctx context.Context, id string, tenantID string) (*models.Transfer, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid transfer id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("TRANSFER_NOT_FOUND", "Transfer not found", err) }
	return m, nil
}

func (s *TransferService) Create(ctx context.Context, body models.CreateTransferRequest, tenantID string, createdBy models.InventoryUser) (*models.Transfer, error) {
	if strings.TrimSpace(body.Name) == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Name is required", nil) }
	if strings.TrimSpace(body.DepartureShopID) == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Departure store is required", nil) }
	if strings.TrimSpace(body.ArrivalShopID) == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Arrival store is required", nil) }
	if body.DepartureShopID == body.ArrivalShopID { return nil, utils.BadRequest("VALIDATION_ERROR", "Departure and arrival stores must be different", nil) }

	depName, arrName := "", ""
	if st, err := s.stores.GetByIDHex(ctx, body.DepartureShopID, tenantID); err == nil { depName = st.Title }
	if st, err := s.stores.GetByIDHex(ctx, body.ArrivalShopID, tenantID); err == nil { arrName = st.Title }

	m := &models.Transfer{
		TenantID: tenantID,
		ExternalID: generateExternalIDTransfer(),
		Name: body.Name,
		DepartureShopID: body.DepartureShopID,
		DepartureShopName: depName,
		ArrivalShopID: body.ArrivalShopID,
		ArrivalShopName: arrName,
		FromFile: body.FromFile,
		Status: "NEW",
		CreatedBy: createdBy,
		Items: []models.TransferItem{},
	}
	m, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("TRANSFER_CREATE_FAILED", "Unable to create transfer", err) }
	return m, nil
}

func (s *TransferService) Update(ctx context.Context, id string, body models.UpdateTransferRequest, tenantID string, actor models.InventoryUser) (*models.Transfer, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid transfer id", err) }
	update := bson.M{}
	if strings.TrimSpace(body.Name) != "" { update["name"] = body.Name }

	// update items
	if body.Items != nil {
		items := make([]models.TransferItem, 0, len(body.Items))
		var totalQty, totalPrice float64
		for _, it := range body.Items {
			pid, err := primitive.ObjectIDFromHex(it.ProductID); if err != nil { return nil, utils.BadRequest("INVALID_PRODUCT_ID", "Invalid product id in items", err) }
			p, err := s.product.Get(ctx, pid, tenantID)
			if err != nil { if p2, e2 := s.product.GetByID(ctx, pid); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for transfer", err) } }
			// clamp qty by available stock
			qty := it.Qty
			if int(qty) > p.Stock { qty = float64(p.Stock) }
			items = append(items, models.TransferItem{ ProductID: pid, ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: it.Barcode, Qty: qty, Unit: it.Unit, SupplyPrice: it.SupplyPrice, RetailPrice: it.RetailPrice })
			totalQty += qty
			totalPrice += qty * it.RetailPrice
		}
		update["items"] = items
		update["total_qty"] = totalQty
		update["total_price"] = totalPrice
	}

	// approve / reject
	if body.Action == "approve" || body.Action == "reject" {
		cur, err := s.repo.Get(ctx, oid, tenantID)
		if err != nil { return nil, utils.NotFound("TRANSFER_NOT_FOUND", "Transfer not found", err) }
		if cur.Status != "NEW" { return cur, nil }
		if body.Action == "approve" {
			// reduce stock by departure store availability (global stock field used)
			for _, it := range cur.Items {
				p, err := s.product.Get(ctx, it.ProductID, tenantID)
				if err != nil { if p2, e2 := s.product.GetByID(ctx, it.ProductID); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for transfer", err) } }
				if int(it.Qty) > p.Stock { return nil, utils.BadRequest("TRANSFER_QTY_EXCEEDS_STOCK", "Transfer qty exceeds current stock", nil) }
				newStock := p.Stock - int(it.Qty)
				if newStock < 0 { newStock = 0 }
				if err := s.product.UpdateStock(ctx, p.ID, p.TenantID, newStock); err != nil { return nil, utils.Internal("PRODUCT_STOCK_UPDATE_FAILED", "Failed to update product stock", err) }
			}
			update["status"] = "APPROVED"
			now := time.Now().UTC()
			update["finished_at"] = now
			update["finished_by"] = actor
		} else {
			update["status"] = "REJECTED"
			now := time.Now().UTC()
			update["finished_at"] = now
			update["finished_by"] = actor
		}
	}

	m, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("TRANSFER_UPDATE_FAILED", "Unable to update transfer", err) }
	return m, nil
}

func (s *TransferService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid transfer id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("TRANSFER_DELETE_FAILED", "Unable to delete transfer", err) }
	return nil
}

func generateExternalIDTransfer() int64 {
	rand.Seed(time.Now().UnixNano())
	return 100000 + int64(rand.Intn(900000))
}

// reuse helpers
// sortField is defined in writeoff_service.go; reuse it here to avoid duplicates 