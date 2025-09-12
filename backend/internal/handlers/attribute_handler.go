package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type AttributeHandler struct {
	svc *services.AttributeService
}

func NewAttributeHandler(svc *services.AttributeService) *AttributeHandler {
	return &AttributeHandler{svc: svc}
}

func (h *AttributeHandler) Register(r fiber.Router) {
	r.Get("/attributes", h.List)
	r.Get("/attributes/:id", h.Get)
	r.Post("/attributes", h.Create)
	r.Patch("/attributes/:id", h.Update)
	r.Delete("/attributes/:id", h.Delete)
}

func (h *AttributeHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.AttributeDTO]]{
		Data: utils.Paginated[models.AttributeDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *AttributeHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *AttributeHandler) Create(c *fiber.Ctx) error {
	var body models.AttributeCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Create(c.Context(), body)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.AttributeDTO]{
		Data: *item,
	})
}

func (h *AttributeHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.AttributeUpdate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil {
		return err
	}

	return utils.Success(c, item)
}

func (h *AttributeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}
	return utils.NoContent(c)
} 