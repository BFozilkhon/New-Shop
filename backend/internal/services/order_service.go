package services

import (
	"context"
	"strings"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderService struct {
	repo        *repositories.OrderRepository
	productRepo *repositories.ProductRepository
	supplierRepo *repositories.SupplierRepository
	storeRepo   *repositories.StoreRepository
	writeOffRepo *repositories.WriteOffRepository
}

func NewOrderService(repo *repositories.OrderRepository, productRepo *repositories.ProductRepository, supplierRepo *repositories.SupplierRepository, storeRepo *repositories.StoreRepository, writeOffRepo *repositories.WriteOffRepository) *OrderService {
	return &OrderService{repo: repo, productRepo: productRepo, supplierRepo: supplierRepo, storeRepo: storeRepo, writeOffRepo: writeOffRepo}
}

func (s *OrderService) List(ctx context.Context, f models.OrderFilterRequest, tenantID string) ([]models.Order, int64, error) {
	var fromPtr, toPtr *time.Time
	if strings.TrimSpace(f.DateFrom) != "" { if t, err := time.Parse(time.RFC3339, f.DateFrom); err == nil { fromPtr = &t } }
	if strings.TrimSpace(f.DateTo) != "" { if t, err := time.Parse(time.RFC3339, f.DateTo); err == nil { toPtr = &t } }
	items, total, err := s.repo.List(ctx, repositories.OrderListParams{
		TenantID: tenantID,
		Page: int64(ifZero(f.Page, 1)),
		Limit: int64(ifZero(f.Limit, 20)),
		Search: f.Search,
		StatusID: f.StatusID,
		SupplierID: f.SupplierID,
		ShopID: f.ShopID,
		Type: f.Type,
		SortBy: ifEmpty(f.SortBy, "created_at"),
		SortOrder: sortOrderValue(f.SortOrder),
		DateFrom: fromPtr,
		DateTo: toPtr,
	})
	if err != nil { return nil, 0, utils.Internal("ORDER_LIST_FAILED", "Unable to list orders", err) }
	return items, total, nil
}

func (s *OrderService) Get(ctx context.Context, id string, tenantID string) (*models.Order, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid order id", nil) }
	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("ORDER_NOT_FOUND", "Order not found", err) }
	return m, nil
}

func (s *OrderService) Create(ctx context.Context, body models.CreateOrderRequest, tenantID string, createdBy models.OrderUser) (*models.Order, error) {
	if strings.TrimSpace(body.Name) == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Order name is required", nil) }
	if body.SupplierID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Supplier is required", nil) }
	if body.ShopID == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Shop is required", nil) }

	order := &models.Order{ TenantID: tenantID, Name: body.Name, Comment: body.Comment, Type: ifEmpty(body.Type, "supplier_order"), SupplierID: body.SupplierID, ShopID: body.ShopID, CreatedBy: createdBy, Payments: []models.OrderPayment{}, Items: []models.OrderItem{} }
	// generate short external id if not provided
	if order.ExternalID == 0 { order.ExternalID = time.Now().Unix()%1000000 }

	// Enrich supplier/shop minimal data if present
	if oid, err := primitive.ObjectIDFromHex(body.SupplierID); err == nil {
		if sup, err := s.supplierRepo.Get(ctx, oid); err == nil {
			order.Supplier = models.OrderSupplier{ ID: sup.ID.Hex(), Name: sup.Name, PhoneNumbers: []string{strings.TrimSpace(sup.Phone)}, ExternalID: 0 }
		}
	}
	if oid, err := primitive.ObjectIDFromHex(body.ShopID); err == nil {
		if st, err := s.storeRepo.Get(ctx, oid); err == nil {
			order.Shop = models.OrderShop{ ID: st.ID.Hex(), Name: st.Title }
		}
	}

	// Return order: copy items from source order if provided
	if strings.ToLower(order.Type) == "return_order" && strings.TrimSpace(body.ReturnedSupplierOrderID) != "" {
		if srcID, err := primitive.ObjectIDFromHex(body.ReturnedSupplierOrderID); err == nil {
			src, err := s.repo.Get(ctx, srcID, tenantID)
			if err == nil && strings.ToLower(src.StatusID) == "accepted" {
				order.ReturnedSupplierOrderID = src.ID.Hex()
				order.ReturnedSupplierOrderName = src.Name
				for _, it := range src.Items {
					order.Items = append(order.Items, models.OrderItem{
						ProductID: it.ProductID,
						ProductName: it.ProductName,
						ProductSKU: it.ProductSKU,
						Quantity: it.Quantity,
						UnitPrice: it.UnitPrice,
						TotalPrice: it.UnitPrice*float64(it.Quantity),
						SupplyPrice: it.SupplyPrice,
						RetailPrice: it.RetailPrice,
						Unit: it.Unit,
					})
				}
			}
		}
	}

	// Map items from payload (fallback or additional)
	for _, it := range body.Items {
		var pid primitive.ObjectID
		if it.ProductID != "" { if x, err := primitive.ObjectIDFromHex(it.ProductID); err == nil { pid = x } }
		name := strings.TrimSpace(it.ProductName)
		sku := strings.TrimSpace(it.ProductSKU)
		if pid != primitive.NilObjectID && (name == "" || sku == "") {
			if p, err := s.productRepo.Get(ctx, pid, tenantID); err == nil {
				if name == "" { name = p.Name }
				if sku == "" { sku = p.SKU }
			}
		}
		q := it.Quantity; if q < 1 { q = 1 }
		unitPrice := it.UnitPrice
		supply := it.SupplyPrice
		retail := it.RetailPrice
		order.Items = append(order.Items, models.OrderItem{
			ProductID: pid, ProductName: name, ProductSKU: sku, Quantity: q, UnitPrice: unitPrice, TotalPrice: unitPrice*float64(q), SupplyPrice: supply, RetailPrice: retail, Unit: it.Unit,
		})
	}
	// Totals
	s.computeTotals(order)

	created, err := s.repo.Create(ctx, order)
	if err != nil { return nil, utils.Internal("ORDER_CREATE_FAILED", "Unable to create order", err) }
	return created, nil
}

func (s *OrderService) Update(ctx context.Context, id string, body models.UpdateOrderRequest, tenantID string, user models.OrderUser) (*models.Order, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid order id", nil) }

	current, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return nil, utils.NotFound("ORDER_NOT_FOUND", "Order not found", err) }
	// If already accepted (finished and not rejected), disallow edits other than no-op
	if current.IsFinished && strings.ToLower(current.StatusID) != "rejected" {
		// Allow idempotent calls without modifications
		if strings.TrimSpace(body.Action) == "" {
			return current, nil
		}
		return nil, utils.BadRequest("ORDER_LOCKED", "Order already accepted and cannot be changed", nil)
	}

	upd := bson.M{}
	if strings.TrimSpace(body.Name) != "" { upd["name"] = body.Name }
	if body.Comment != "" { upd["comment"] = body.Comment }
	if body.StatusID != "" { upd["status_id"] = body.StatusID }
	if body.PaymentDate != "" { upd["payment_date"] = body.PaymentDate }
	if body.SettlementType != "" { upd["settlement_type"] = body.SettlementType }
	if body.IsFinished { upd["is_finished"] = true }
	if body.SaleProgress != 0 { upd["sale_progress"] = body.SaleProgress }

	// Rebuild items if provided
	var rebuilt []models.OrderItem
	if len(body.Items) > 0 {
		rebuilt = make([]models.OrderItem, 0, len(body.Items))
		for _, it := range body.Items {
			var pid primitive.ObjectID
			if it.ProductID != "" { if x, err := primitive.ObjectIDFromHex(it.ProductID); err == nil { pid = x } }
			name := strings.TrimSpace(it.ProductName)
			sku := strings.TrimSpace(it.ProductSKU)
			q := it.Quantity; if q < 1 { q = 1 }
			unitPrice := it.UnitPrice
			supply := it.SupplyPrice
			retail := it.RetailPrice
			// allow client to send returned_quantity for return orders; keep in ReturnedQuantity field
			returnedQ := it.ReturnedQuantity
			if returnedQ < 0 { returnedQ = 0 }
			if returnedQ > q { returnedQ = q }
			rebuilt = append(rebuilt, models.OrderItem{ ProductID: pid, ProductName: name, ProductSKU: sku, Quantity: q, UnitPrice: unitPrice, TotalPrice: unitPrice*float64(q), SupplyPrice: supply, RetailPrice: retail, Unit: it.Unit, ReturnedQuantity: returnedQ })
		}
		upd["items"] = rebuilt
	}
	if body.TotalPrice != 0 { upd["total_price"] = body.TotalPrice }
	if body.TotalSupplyPrice != 0 { upd["total_supply_price"] = body.TotalSupplyPrice }
	if body.TotalRetailPrice != 0 { upd["total_retail_price"] = body.TotalRetailPrice }
	if body.TotalPaidAmount != 0 { upd["total_paid_amount"] = body.TotalPaidAmount }

	// Items to use for stock effects (prefer rebuilt from this request)
	itemsForApply := current.Items
	if len(rebuilt) > 0 { itemsForApply = rebuilt }

	// Approve/Reject actions
	if body.Action == "approve" || body.Action == "reject" {
		if body.Action == "approve" && !current.IsFinished {
			if strings.ToLower(current.Type) == "return_order" {
				// Decrease stock for each item; use ReturnedQuantity if present, else Quantity
				for _, it := range itemsForApply {
					if it.ProductID == primitive.NilObjectID { continue }
					qty := it.ReturnedQuantity
					if qty <= 0 || qty > it.Quantity { qty = it.Quantity }
					p, err := s.productRepo.Get(ctx, it.ProductID, tenantID)
					if err != nil { if p2, e2 := s.productRepo.GetByID(ctx, it.ProductID); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for return order", err) } }
					newStock := p.Stock - int(qty)
					if newStock < 0 { newStock = 0 }
					if err := s.productRepo.UpdateStock(ctx, p.ID, p.TenantID, newStock); err != nil { return nil, utils.Internal("PRODUCT_STOCK_UPDATE_FAILED", "Failed to update product stock", err) }
				}
				// Mark accepted
				upd["is_finished"] = true
				upd["status_id"] = "accepted"
				upd["accepted_by"] = user
				upd["accepting_date"] = time.Now().UTC().Format(time.RFC3339)
				// Create a write-off document capturing the return with returned quantities
				if s.writeOffRepo != nil {
					go func(){
						defer func(){ _ = recover() }()
						woSvc := NewWriteOffService(s.writeOffRepo, s.storeRepo, s.productRepo)
						woItems := make([]models.WriteOffItemInput, 0, len(itemsForApply))
						for _, it := range itemsForApply {
							qty := it.ReturnedQuantity; if qty <= 0 || qty > it.Quantity { qty = it.Quantity }
							woItems = append(woItems, models.WriteOffItemInput{ ProductID: it.ProductID.Hex(), ProductName: it.ProductName, ProductSKU: it.ProductSKU, Barcode: "", Qty: float64(qty), Unit: it.Unit, SupplyPrice: it.SupplyPrice, RetailPrice: it.RetailPrice })
						}
						created, err := woSvc.Create(ctx, models.CreateWriteOffRequest{ Name: "Order return write-off", FromFile: false, ShopID: current.ShopID, Reason: "order_return" }, tenantID, models.InventoryUser{ ID: user.ID, Name: user.Name })
						if err == nil { _, _ = woSvc.Update(ctx, created.ID.Hex(), models.UpdateWriteOffRequest{ Name: created.Name, Items: woItems, Action: "approve" }, tenantID, models.InventoryUser{ ID: user.ID, Name: user.Name }) }
					}()
				}
			} else {
				// Supplier order: increase stock and optionally update prices
				for _, it := range itemsForApply {
					if it.ProductID == primitive.NilObjectID { continue }
					p, err := s.productRepo.Get(ctx, it.ProductID, tenantID)
					if err != nil { if p2, e2 := s.productRepo.GetByID(ctx, it.ProductID); e2 == nil { p = p2 } else { return nil, utils.BadRequest("PRODUCT_NOT_FOUND", "Product not found for order", err) } }
					newStock := p.Stock + int(it.Quantity)
					if err := s.productRepo.UpdateStock(ctx, p.ID, p.TenantID, newStock); err != nil { return nil, utils.Internal("PRODUCT_STOCK_UPDATE_FAILED", "Failed to update product stock", err) }
					// update prices if provided (>0)
					if it.SupplyPrice > 0 || it.RetailPrice > 0 { _ = s.productRepo.UpdatePrices(ctx, p.ID, p.TenantID, it.SupplyPrice, it.RetailPrice) }
				}
				upd["is_finished"] = true
				upd["status_id"] = "accepted"
				upd["accepted_by"] = user
				upd["accepting_date"] = time.Now().UTC().Format(time.RFC3339)
			}
		} else if body.Action == "reject" && !current.IsFinished {
			upd["is_finished"] = true
			upd["status_id"] = "rejected"
		}
	}

	updated, err := s.repo.Update(ctx, oid, tenantID, upd)
	if err != nil { return nil, utils.Internal("ORDER_UPDATE_FAILED", "Unable to update order", err) }
	return updated, nil
}

func (s *OrderService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid order id", nil) }
	current, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil { return utils.NotFound("ORDER_NOT_FOUND", "Order not found", err) }
	if current.IsFinished && strings.ToLower(current.StatusID) != "rejected" {
		return utils.BadRequest("ORDER_LOCKED", "Accepted orders cannot be deleted", nil)
	}
	if err := s.repo.Delete(ctx, oid, tenantID); err != nil { return utils.Internal("ORDER_DELETE_FAILED", "Unable to delete order", err) }
	return nil
}

func (s *OrderService) AddPayment(ctx context.Context, id string, tenantID string, req models.AddOrderPaymentRequest) (*models.Order, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid order id", nil) }
	if req.Amount <= 0 { return nil, utils.BadRequest("VALIDATION_ERROR", "Amount must be greater than 0", nil) }
	p := models.OrderPayment{ Amount: req.Amount, PaymentDate: ifZeroTime(req.PaymentDate, time.Now().UTC()), PaymentMethod: req.PaymentMethod, Description: req.Description, Status: "paid" }
	m, err := s.repo.AddPayment(ctx, oid, tenantID, p)
	if err != nil { return nil, utils.Internal("ORDER_ADD_PAYMENT_FAILED", "Unable to add payment", err) }
	return m, nil
}

func (s *OrderService) PaymentsBySupplier(ctx context.Context, supplierID, shopID, tenantID string, page, limit int64) ([]repositories.SupplierPayment, int64, error) {
	if strings.TrimSpace(supplierID) == "" { return nil, 0, utils.BadRequest("INVALID_SUPPLIER", "Supplier id required", nil) }
	items, total, err := s.repo.PaymentsBySupplier(ctx, tenantID, supplierID, shopID, page, limit)
	if err != nil { return nil, 0, utils.Internal("SUPPLIER_PAYMENTS_FAILED", "Unable to list supplier payments", err) }
	return items, total, nil
}

func (s *OrderService) SupplierStats(ctx context.Context, supplierID string, shopID string, tenantID string) (map[string]interface{}, error) {
	if strings.TrimSpace(supplierID) == "" { return nil, utils.BadRequest("INVALID_SUPPLIER", "Supplier id required", nil) }
	st, err := s.repo.SupplierStats(ctx, tenantID, supplierID, shopID)
	if err != nil { return nil, utils.Internal("SUPPLIER_STATS_FAILED", "Unable to compute supplier stats", err) }
	res := map[string]interface{}{
		"total_orders": st.TotalOrders,
		"paid_orders": st.PaidCount,
		"unpaid_orders": st.UnpaidCount,
		"partially_paid_orders": st.PartialCount,
		"amount_of_orders": st.TotalAmount,
		"amount_paid": st.TotalPaid,
		"total_items": st.TotalItems,
		"first_order_at": st.MinCreated,
		"last_order_at": st.MaxCreated,
		"order_frequency": func() string {
			if st.MinCreated == nil || st.MaxCreated == nil || st.TotalOrders == 0 { return "once a month" }
			days := st.MaxCreated.Sub(*st.MinCreated).Hours() / 24.0
			if days <= 0 { return "once a month" }
			avgDays := days / float64(st.TotalOrders)
			if avgDays <= 7 { return "once a week" }
			if avgDays <= 30 { return "once a month" }
			return "rarely"
		}(),
	}
	return res, nil
}

func (s *OrderService) ProductsBySupplier(ctx context.Context, supplierID, shopID, search, tenantID string, page, limit int64) ([]repositories.SupplierProductRow, int64, error) {
	if strings.TrimSpace(supplierID) == "" { return nil, 0, utils.BadRequest("INVALID_SUPPLIER", "Supplier id required", nil) }
	items, total, err := s.repo.ProductsBySupplier(ctx, tenantID, supplierID, shopID, search, page, limit)
	if err != nil { return nil, 0, utils.Internal("SUPPLIER_PRODUCTS_FAILED", "Unable to list supplier products", err) }
	return items, total, nil
}

func (s *OrderService) computeTotals(o *models.Order) {
	var qtySum int
	var total, totalSupply, totalRetail float64
	for i := range o.Items {
		line := &o.Items[i]
		line.TotalPrice = line.UnitPrice * float64(line.Quantity)
		qtySum += line.Quantity
		total += line.TotalPrice
		totalSupply += line.SupplyPrice * float64(line.Quantity)
		totalRetail += line.RetailPrice * float64(line.Quantity)
	}
	o.ItemsCount = qtySum
	o.TotalPrice = total
	o.TotalSupplyPrice = totalSupply
	o.TotalRetailPrice = totalRetail
}

// helpers
func ifZero(v, d int) int { if v == 0 { return d }; return v }
func ifEmpty(v, d string) string { if strings.TrimSpace(v) == "" { return d }; return v }
func sortOrderValue(s string) int { if strings.ToLower(s) == "asc" { return 1 }; if strings.ToLower(s) == "desc" { return -1 }; return -1 }
func ifZeroTime(t time.Time, d time.Time) time.Time { if t.IsZero() { return d }; return t } 