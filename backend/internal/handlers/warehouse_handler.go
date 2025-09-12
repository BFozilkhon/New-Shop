package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type WarehouseHandler struct {
	svc *services.WarehouseService
}

func NewWarehouseHandler(svc *services.WarehouseService) *WarehouseHandler {
	return &WarehouseHandler{svc: svc}
}

func (h *WarehouseHandler) Register(r fiber.Router) {
	r.Get("/warehouses", h.List)
	r.Get("/warehouses/:id", h.Get)
	r.Post("/warehouses", h.Create)
	r.Patch("/warehouses/:id", h.Update)
	r.Delete("/warehouses/:id", h.Delete)
}

func (h *WarehouseHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	warehouseType := c.Query("type", "")
	tenantID := c.Locals("tenant_id").(string)

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr, warehouseType, tenantID)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.WarehouseDTO]]{
		Data: utils.Paginated[models.WarehouseDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *WarehouseHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *WarehouseHandler) Create(c *fiber.Ctx) error {
	var body models.WarehouseCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.WarehouseDTO]{
		Data: *item,
	})
}

func (h *WarehouseHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.WarehouseUpdate
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

func (h *WarehouseHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil {
		return err
	}
	return utils.NoContent(c)
} 