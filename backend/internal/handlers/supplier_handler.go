package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
	"shop/backend/internal/repositories"
)

type SupplierHandler struct { svc *services.SupplierService }

func NewSupplierHandler(svc *services.SupplierService) *SupplierHandler { return &SupplierHandler{svc: svc} }

func (h *SupplierHandler) Register(r fiber.Router) {
	r.Get("/suppliers", h.List)
	r.Get("/suppliers/:id", h.Get)
	r.Get("/suppliers/:id/stats", h.Stats)
	r.Get("/suppliers/:id/payments", h.Payments)
	// new products endpoint
	r.Get("/suppliers/:id/products", h.Products)
	r.Post("/suppliers", h.Create)
	r.Patch("/suppliers/:id", h.Update)
	r.Delete("/suppliers/:id", h.Delete)
}

func (h *SupplierHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	items, total, err := h.svc.List(c.Context(), page, limit, search)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.SupplierDTO]]{ Data: utils.Paginated[models.SupplierDTO]{ Items: items, Total: total } })
}

func (h *SupplierHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *SupplierHandler) Stats(c *fiber.Ctx) error {
	id := c.Params("id")
	shopID := c.Query("shop_id", "")
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	if svc, ok := services.GetOrderService(); ok {
		stats, err := svc.SupplierStats(c.Context(), id, shopID, tenantID.(string))
		if err != nil { return err }
		return utils.Success(c, stats)
	}
	return utils.Internal("SERVICE_UNAVAILABLE", "Order service not available", nil)
}

func (h *SupplierHandler) Payments(c *fiber.Ctx) error {
	id := c.Params("id")
	shopID := c.Query("shop_id", "")
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "20"), 10, 64)
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	if svc, ok := services.GetOrderService(); ok {
		items, total, err := svc.PaymentsBySupplier(c.Context(), id, shopID, tenantID.(string), page, limit)
		if err != nil { return err }
		return c.JSON(utils.SuccessResponse[utils.Paginated[repositories.SupplierPayment]]{ Data: utils.Paginated[repositories.SupplierPayment]{ Items: items, Total: total } })
	}
	return utils.Internal("SERVICE_UNAVAILABLE", "Order service not available", nil)
}

func (h *SupplierHandler) Products(c *fiber.Ctx) error {
	id := c.Params("id")
	shopID := c.Query("shop_id", "")
	search := c.Query("search", "")
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "20"), 10, 64)
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	if svc, ok := services.GetOrderService(); ok {
		items, total, err := svc.ProductsBySupplier(c.Context(), id, shopID, search, tenantID.(string), page, limit)
		if err != nil { return err }
		return c.JSON(utils.SuccessResponse[utils.Paginated[repositories.SupplierProductRow]]{ Data: utils.Paginated[repositories.SupplierProductRow]{ Items: items, Total: total } })
	}
	return utils.Internal("SERVICE_UNAVAILABLE", "Order service not available", nil)
}

func (h *SupplierHandler) Create(c *fiber.Ctx) error {
	var body models.SupplierCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Create(c.Context(), body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.SupplierDTO]{ Data: *item })
}

func (h *SupplierHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.SupplierUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *SupplierHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil { return err }
	return utils.NoContent(c)
} 