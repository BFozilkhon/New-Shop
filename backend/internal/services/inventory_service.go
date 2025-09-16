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

type InventoryService struct {
	repo *repositories.InventoryRepository
	stores *repositories.StoreRepository
	productRepo *repositories.ProductRepository
}

func NewInventoryService(repo *repositories.InventoryRepository, stores *repositories.StoreRepository, productRepo *repositories.ProductRepository) *InventoryService { return &InventoryService{repo: repo, stores: stores, productRepo: productRepo} }

func (s *InventoryService) List(ctx context.Context, f models.InventoryFilterRequest, tenantID string) ([]models.Inventory, int64, error) {
	var fromPtr, toPtr *time.Time
	if strings.TrimSpace(f.DateFrom) != "" { if t, err := time.Parse(time.RFC3339, f.DateFrom); err == nil { fromPtr = &t } }
	if strings.TrimSpace(f.DateTo) != "" { if t, err := time.Parse(time.RFC3339, f.DateTo); err == nil { toPtr = &t } }
	items, total, err := s.repo.List(ctx, repositories.InventoryListParams{
		TenantID: tenantID,
		Page: int64(ifZero(f.Page, 1)),
		Limit: int64(ifZero(f.Limit, 20)),
		Search: f.Search,
		ShopID: f.ShopID,
		StatusID: f.StatusID,
		Type: f.Type,
		SortBy: ifEmpty(f.SortBy, "created_at"),
		SortOrder: sortOrderValue(f.SortOrder),
		DateFrom: fromPtr,
		DateTo: toPtr,
	})
	if err != nil { return nil, 0, utils.Internal("INVENTORY_LIST_FAILED", "Unable to list inventories", err) }
	return items, total, nil
}

func (s *InventoryService) Get(ctx context.Context, id string, tenantID string) (*models.Inventory, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid inventory id", nil) }
	it, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("INVENTORY_NOT_FOUND", "Inventory not found", err) }
	return it, nil
}

func (s *InventoryService) Create(ctx context.Context, body models.CreateInventoryRequest, tenantID string, createdBy models.InventoryUser) (*models.Inventory, error) {
	if body.Name == "" || body.ShopID == "" || body.Type == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "name, shop_id and type are required", nil)
	}
	var shopName string
	if s.stores != nil {
		if oid, err := primitive.ObjectIDFromHex(body.ShopID); err == nil {
			if st, err := s.stores.Get(ctx, oid); err == nil && st != nil { shopName = st.Title }
		}
	}
	// generate 6-digit external id
	rnd := int64(100000 + rand.Intn(900000))
	m := &models.Inventory{
		TenantID: tenantID,
		ExternalID: rnd,
		Name: body.Name,
		ShopID: body.ShopID,
		ShopName: shopName,
		Type: strings.ToUpper(body.Type),
		CreatedBy: createdBy,
		ProcessPct: 0,
	}
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("INVENTORY_CREATE_FAILED", "Unable to create inventory", err) }
	return created, nil
}

func (s *InventoryService) Update(ctx context.Context, id string, body models.UpdateInventoryRequest, tenantID string, user models.InventoryUser) (*models.Inventory, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid inventory id", nil) }
	update := bson.M{}
	if strings.TrimSpace(body.Name) != "" { update["name"] = body.Name }
	if strings.TrimSpace(body.StatusID) != "" { update["status_id"] = body.StatusID }
	var bodyItems []models.InventoryItemInput
	if body.Items != nil {
		items := make([]models.InventoryItem, 0, len(body.Items))
		var total float64
		var shortage, surplus int
		var differenceSum float64
		for _, it := range body.Items {
			var pid primitive.ObjectID
			if it.ProductID != "" { if oid, err := primitive.ObjectIDFromHex(it.ProductID); err == nil { pid = oid } }
			items = append(items, models.InventoryItem{ ProductID: pid, ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: it.Barcode, Declared: it.Declared, Scanned: it.Scanned, Unit: it.Unit, Price: it.Price, CostPrice: it.CostPrice })
			// totals
			total += it.Scanned
			if it.Scanned < it.Declared { shortage++ }
			if it.Scanned > it.Declared { surplus++ }
			diffQty := it.Scanned - it.Declared
			if diffQty > 0 { differenceSum += diffQty * it.Price } else if diffQty < 0 { differenceSum += diffQty * it.CostPrice }
		}
		update["items"] = items
		update["total_measurement_value"] = total
		update["shortage"] = shortage
		update["surplus"] = surplus
		update["difference_sum"] = differenceSum
		bodyItems = body.Items
	}
	if body.Finished { now := time.Now().UTC(); update["finished_at"] = now; update["finished_by"] = user; update["status_id"] = "finished" }
	m, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil { return nil, utils.Internal("INVENTORY_UPDATE_FAILED", "Unable to update inventory", err) }
	// On finish: update product stocks to match scanned values
	if body.Finished && s.productRepo != nil {
		itemsToApply := bodyItems
		if itemsToApply == nil || len(itemsToApply) == 0 {
			if m2, err2 := s.repo.Get(ctx, oid, tenantID); err2 == nil && m2 != nil {
				itemsToApply = make([]models.InventoryItemInput, 0, len(m2.Items))
				for _, it := range m2.Items {
					itemsToApply = append(itemsToApply, models.InventoryItemInput{ ProductID: it.ProductID.Hex(), ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: it.Barcode, Declared: it.Declared, Scanned: it.Scanned, Unit: it.Unit, Price: it.Price, CostPrice: it.CostPrice })
				}
			}
		}
		for _, it := range itemsToApply {
			if it.ProductID == "" { continue }
			pid, err := primitive.ObjectIDFromHex(it.ProductID)
			if err != nil { continue }
			// Set actual stock equal to scanned
			_ = s.productRepo.UpdateStock(ctx, pid, tenantID, int(it.Scanned))
		}
	}
	return m, nil
}

func (s *InventoryService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid inventory id", nil) }
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("INVENTORY_DELETE_FAILED", "Unable to delete inventory", err) }
	return nil
} 