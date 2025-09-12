package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type BrandHandler struct {
	svc *services.BrandService
}

func NewBrandHandler(svc *services.BrandService) *BrandHandler {
	return &BrandHandler{svc: svc}
}

func (h *BrandHandler) Register(r fiber.Router) {
	r.Get("/brands", h.List)
	r.Get("/brands/:id", h.Get)
	r.Post("/brands", h.Create)
	r.Patch("/brands/:id", h.Update)
	r.Delete("/brands/:id", h.Delete)
}

func (h *BrandHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID := c.Locals("tenant_id").(string)

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr, tenantID)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.BrandDTO]]{
		Data: utils.Paginated[models.BrandDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *BrandHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *BrandHandler) Create(c *fiber.Ctx) error {
	var body models.BrandCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.BrandDTO]{
		Data: *item,
	})
}

func (h *BrandHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.BrandUpdate
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

func (h *BrandHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil {
		return err
	}
	return utils.NoContent(c)
} 