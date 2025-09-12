package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type CharacteristicHandler struct {
	svc *services.CharacteristicService
}

func NewCharacteristicHandler(svc *services.CharacteristicService) *CharacteristicHandler {
	return &CharacteristicHandler{svc: svc}
}

func (h *CharacteristicHandler) Register(r fiber.Router) {
	r.Get("/characteristics", h.List)
	r.Get("/characteristics/:id", h.Get)
	r.Post("/characteristics", h.Create)
	r.Patch("/characteristics/:id", h.Update)
	r.Delete("/characteristics/:id", h.Delete)
}

func (h *CharacteristicHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	characteristicType := c.Query("type", "")

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr, characteristicType)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.CharacteristicDTO]]{
		Data: utils.Paginated[models.CharacteristicDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *CharacteristicHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *CharacteristicHandler) Create(c *fiber.Ctx) error {
	var body models.CharacteristicCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Create(c.Context(), body)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.CharacteristicDTO]{
		Data: *item,
	})
}

func (h *CharacteristicHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.CharacteristicUpdate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil {
		return err
	}

	return utils.Success(c, item)
}

func (h *CharacteristicHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}
	return utils.NoContent(c)
} 