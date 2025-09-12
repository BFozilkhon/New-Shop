package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ParameterHandler struct {
	svc *services.ParameterService
}

func NewParameterHandler(svc *services.ParameterService) *ParameterHandler {
	return &ParameterHandler{svc: svc}
}

func (h *ParameterHandler) Register(r fiber.Router) {
	r.Get("/parameters", h.List)
	r.Get("/parameters/:id", h.Get)
	r.Post("/parameters", h.Create)
	r.Patch("/parameters/:id", h.Update)
	r.Delete("/parameters/:id", h.Delete)
}

func (h *ParameterHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	paramType := c.Query("type", "")
	status := c.Query("status", "")
	category := c.Query("category", "")
	tenantID := c.Locals("tenant_id").(string)

	var requiredPtr *bool
	if v := c.Query("required", ""); v != "" {
		b := v == "true" || v == "1"
		requiredPtr = &b
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, paramType, status, category, requiredPtr, tenantID)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ParameterDTO]]{
		Data: utils.Paginated[models.ParameterDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *ParameterHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *ParameterHandler) Create(c *fiber.Ctx) error {
	var body models.ParameterCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ParameterDTO]{
		Data: *item,
	})
}

func (h *ParameterHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ParameterUpdate
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

func (h *ParameterHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil {
		return err
	}
	return utils.NoContent(c)
} 