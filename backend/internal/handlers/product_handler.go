package handlers

import (
	"strconv"
	"context"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ProductHandler struct {
	svc *services.ProductService
}

func NewProductHandler(svc *services.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

func (h *ProductHandler) Register(r fiber.Router) {
	r.Get("/products", h.List)
	r.Get("/products/stats", h.Stats)
	r.Get("/products/summary", h.Summary)
	r.Get("/products/:id", h.Get)
	r.Post("/products", h.Create)
	r.Patch("/products/:id", h.Update)
	r.Delete("/products/:id", h.Delete)
	r.Patch("/products/:id/stock", h.UpdateStock)
	// bulk operations
	r.Post("/products/bulk/delete", h.BulkDelete)
	r.Post("/products/bulk/edit-properties", h.BulkEditProperties)
	r.Post("/products/bulk/archive", h.BulkArchive)
	r.Post("/products/bulk/unarchive", h.BulkUnarchive)
}

func (h *ProductHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	categoryID := c.Query("category_id", "")
	brandID := c.Query("brand_id", "")
	supplierID := c.Query("supplier_id", "")
	status := c.Query("status", "")
	storeID := c.Query("store_id", "")
	tenantID := c.Locals("tenant_id").(string)

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	var isBundlePtr *bool
	if v := c.Query("is_bundle", ""); v != "" {
		b := v == "true" || v == "1"
		isBundlePtr = &b
	}

	var minPricePtr *float64
	if v := c.Query("min_price", ""); v != "" {
		if price, err := strconv.ParseFloat(v, 64); err == nil {
			minPricePtr = &price
		}
	}

	var maxPricePtr *float64
	if v := c.Query("max_price", ""); v != "" {
		if price, err := strconv.ParseFloat(v, 64); err == nil {
			maxPricePtr = &price
		}
	}

	low := c.Query("low_stock", "") == "1" || c.Query("low_stock", "") == "true"
	zero := c.Query("zero_stock", "") == "1" || c.Query("zero_stock", "") == "true"
	lowPtr := &low
	zeroPtr := &zero

	archivedParam := c.Query("archived", "")
	var archivedPtr *bool
	if archivedParam != "" {
		arch := archivedParam == "1" || archivedParam == "true"
		archivedPtr = &arch
	}

    // Optional boolean filters
    var isRealPtr *bool
    if v := c.Query("is_realizatsiya", ""); v != "" { b := v=="1" || v=="true"; isRealPtr = &b }
    var isKonsPtr *bool
    if v := c.Query("is_konsignatsiya", ""); v != "" { b := v=="1" || v=="true"; isKonsPtr = &b }
    var isDirtyPtr *bool
    if v := c.Query("is_dirty_core", ""); v != "" { b := v=="1" || v=="true"; isDirtyPtr = &b }

	ctx := context.WithValue(c.Context(), "low_stock", lowPtr)
	ctx = context.WithValue(ctx, "zero_stock", zeroPtr)
	ctx = context.WithValue(ctx, "archived", archivedPtr)
    ctx = context.WithValue(ctx, "is_realizatsiya", isRealPtr)
    ctx = context.WithValue(ctx, "is_konsignatsiya", isKonsPtr)
    ctx = context.WithValue(ctx, "is_dirty_core", isDirtyPtr)

	items, total, err := h.svc.List(ctx, page, limit, search, categoryID, brandID, supplierID, status, isActivePtr, isBundlePtr, minPricePtr, maxPricePtr, tenantID, storeID)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ProductDTO]]{
		Data: utils.Paginated[models.ProductDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *ProductHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var body models.ProductCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ProductDTO]{
		Data: *item,
	})
}

func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ProductUpdate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil {
		return err
	}

	return utils.Success(c, item)
}

func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil {
		return err
	}
	return utils.NoContent(c)
}

func (h *ProductHandler) UpdateStock(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	var body struct {
		Stock int `json:"stock" binding:"required,min=0"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	if err := h.svc.UpdateStock(c.Context(), id, body.Stock, tenantID); err != nil {
		return err
	}

	return utils.NoContent(c)
} 

func (h *ProductHandler) BulkDelete(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	var body struct { IDs []string `json:"ids"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	count, err := h.svc.BulkDelete(c.Context(), body.IDs, tenantID)
	if err != nil { return err }
	return utils.Success(c, map[string]any{"deleted": count})
}

func (h *ProductHandler) BulkEditProperties(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	var body struct { IDs []string `json:"ids"`; Props services.BulkEditProps `json:"props"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	count, err := h.svc.BulkEditProperties(c.Context(), body.IDs, body.Props, tenantID)
	if err != nil { return err }
	return utils.Success(c, map[string]any{"updated": count})
} 

func (h *ProductHandler) BulkArchive(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	var body struct { IDs []string `json:"ids"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	count, err := h.svc.BulkArchive(c.Context(), body.IDs, true, tenantID)
	if err != nil { return err }
	return utils.Success(c, map[string]any{"archived": count})
}

func (h *ProductHandler) BulkUnarchive(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	var body struct { IDs []string `json:"ids"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	count, err := h.svc.BulkArchive(c.Context(), body.IDs, false, tenantID)
	if err != nil { return err }
	return utils.Success(c, map[string]any{"unarchived": count})
}

func (h *ProductHandler) Stats(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	storeID := c.Query("store_id", "")
	stats, err := h.svc.Stats(c.Context(), tenantID, storeID)
	if err != nil { return utils.Internal("PRODUCT_STATS_FAILED", "Unable to get stats", err) }
	return utils.Success(c, stats)
} 

func (h *ProductHandler) Summary(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	storeID := c.Query("store_id", "")
	sum, err := h.svc.Summary(c.Context(), tenantID, storeID)
	if err != nil { return utils.Internal("PRODUCT_SUMMARY_FAILED", "Unable to get summary", err) }
	return utils.Success(c, sum)
} 