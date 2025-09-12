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

type WriteOffService struct {
	repo   *repositories.WriteOffRepository
	store  *repositories.StoreRepository
	product *repositories.ProductRepository
}

func NewWriteOffService(repo *repositories.WriteOffRepository, store *repositories.StoreRepository, product *repositories.ProductRepository) *WriteOffService {
	return &WriteOffService{repo: repo, store: store, product: product}
}

func (s *WriteOffService) List(ctx context.Context, f models.WriteOffFilterRequest, tenantID string) ([]models.WriteOff, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.WriteOffListParams{
		Page: int64(ifZeroInt(f.Page, 1)), Limit: int64(ifZeroInt(f.Limit, 20)), Sort: bson.D{{Key: sortField(f.SortBy, "created_at"), Value: sortOrderValue(f.SortOrder)}},
		Search: f.Search, ShopID: f.ShopID, Status: f.Status, DateFrom: f.DateFrom, DateTo: f.DateTo, TenantID: tenantID,
	})
	if err != nil { return nil, 0, utils.Internal("WRITEOFF_LIST_FAILED", "Unable to list write-offs", err) }
	return items, total, nil
}

func (s *WriteOffService) Get(ctx context.Context, id string, tenantID string) (*models.WriteOff, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid write-off id", err) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("WRITEOFF_NOT_FOUND", "Write-off not found", err) }
	return m, nil
}

func (s *WriteOffService) Create(ctx context.Context, body models.CreateWriteOffRequest, tenantID string, createdBy models.InventoryUser) (*models.WriteOff, error) {
	if body.Name == "" || body.ShopID == "" || body.Reason == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Name, shop and reason are required", nil) }

	shopName := ""
	if st, err := s.store.GetByIDHex(ctx, body.ShopID, tenantID); err == nil { shopName = st.Title }

	m := &models.WriteOff{
		TenantID: tenantID,
		ExternalID: generateExternalID(),
		Name: body.Name,
		ShopID: body.ShopID,
		ShopName: shopName,
		ReasonID: "",
		ReasonName: body.Reason,
		FromFile: body.FromFile,
		Status: "NEW",
		CreatedBy: createdBy,
		Items: []models.WriteOffItem{},
	}
	m, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("WRITEOFF_CREATE_FAILED", "Unable to create write-off", err) }
	return m, nil
}

func (s *WriteOffService) Update(ctx context.Context, id string, body models.UpdateWriteOffRequest, tenantID string, actor models.InventoryUser) (*models.WriteOff, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid write-off id", err) }
	update := bson.M{}
	if body.Name != "" { update["name"] = body.Name }

	// handle items update and recalc totals
	if body.Items != nil {
		items := make([]models.WriteOffItem, 0, len(body.Items))
		var totalQty, totalSupply, totalRetail float64
		for _, it := range body.Items {
			pid, err := primitive.ObjectIDFromHex(it.ProductID); if err != nil { return nil, utils.BadRequest("INVALID_PRODUCT_ID", "Invalid product id in items", err) }
			// validate against current stock (fallback without tenant if needed)
			p, err := s.product.Get(ctx, pid, tenantID)
			if err != nil {
				if p2, e2 := s.product.GetByID(ctx, pid); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for write-off", err) }
			}
			if int(it.Qty) > p.Stock { return nil, utils.BadRequest("WRITEOFF_QTY_EXCEEDS_STOCK", "Write-off quantity exceeds current stock", nil) }
			items = append(items, models.WriteOffItem{ ProductID: pid, ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: it.Barcode, Qty: it.Qty, Unit: it.Unit, SupplyPrice: it.SupplyPrice, RetailPrice: it.RetailPrice })
			totalQty += it.Qty
			totalSupply += it.Qty * it.SupplyPrice
			totalRetail += it.Qty * it.RetailPrice
		}
		update["items"] = items
		update["total_qty"] = totalQty
		update["total_supply_price"] = totalSupply
		update["total_retail_price"] = totalRetail
	}

	// approve/reject actions
	if body.Action == "approve" || body.Action == "reject" {
		// load current state
		cur, err := s.repo.Get(ctx, oid, tenantID)
		if err != nil { return nil, utils.NotFound("WRITEOFF_NOT_FOUND", "Write-off not found", err) }
		if body.Action == "approve" && cur.Status == "NEW" {
			// decrement stock per item
			for _, it := range cur.Items {
				p, err := s.product.Get(ctx, it.ProductID, tenantID)
				if err != nil { if p2, e2 := s.product.GetByID(ctx, it.ProductID); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for write-off", err) } }
				if int(it.Qty) > p.Stock { return nil, utils.BadRequest("WRITEOFF_QTY_EXCEEDS_STOCK", "Write-off quantity exceeds current stock", nil) }
				newStock := p.Stock - int(it.Qty)
				if newStock < 0 { newStock = 0 }
				// use product's own tenant id to ensure update filter matches
				if err := s.product.UpdateStock(ctx, p.ID, p.TenantID, newStock); err != nil { return nil, utils.Internal("PRODUCT_STOCK_UPDATE_FAILED", "Failed to update product stock", err) }
			}
			update["status"] = "APPROVED"
			now := time.Now().UTC()
			update["finished_at"] = now
			update["finished_by"] = actor
		} else if body.Action == "reject" && cur.Status == "NEW" {
			update["status"] = "REJECTED"
			now := time.Now().UTC()
			update["finished_at"] = now
			update["finished_by"] = actor
		}
	}

	m, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("WRITEOFF_UPDATE_FAILED", "Unable to update write-off", err) }
	return m, nil
}

func (s *WriteOffService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid write-off id", err) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("WRITEOFF_DELETE_FAILED", "Unable to delete write-off", err) }
	return nil
}

func generateExternalID() int64 {
	rand.Seed(time.Now().UnixNano())
	return 100000 + int64(rand.Intn(900000))
}

// helpers (avoid duplicates across services)
func ifZeroInt(v, def int) int { if v == 0 { return def }; return v }
func sortField(v, def string) string { if v == "" { return def }; return v } 