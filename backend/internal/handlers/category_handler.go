package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type CategoryHandler struct {
	svc *services.CategoryService
}

func NewCategoryHandler(svc *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

func (h *CategoryHandler) Register(r fiber.Router) {
	r.Get("/categories", h.List)
	r.Get("/categories/tree", h.GetTree)
	r.Get("/categories/:id", h.Get)
	r.Post("/categories", h.Create)
	r.Patch("/categories/:id", h.Update)
	r.Delete("/categories/:id", h.Delete)
}

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	parentID := c.Query("parent_id", "")
	levelStr := c.Query("level", "")

	var isActivePtr *bool
	if v := c.Query("is_active", ""); v != "" {
		b := v == "true" || v == "1"
		isActivePtr = &b
	}

	var parentIDPtr *string
	if parentID != "" {
		parentIDPtr = &parentID
	}

	var levelPtr *int
	if levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil {
			levelPtr = &level
		}
	}

	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr, parentIDPtr, levelPtr)
	if err != nil {
		return err
	}

	return c.JSON(utils.SuccessResponse[utils.Paginated[models.CategoryDTO]]{
		Data: utils.Paginated[models.CategoryDTO]{
			Items: items,
			Total: total,
		},
	})
}

func (h *CategoryHandler) GetTree(c *fiber.Ctx) error {
	tree, err := h.svc.GetTree(c.Context())
	if err != nil {
		return err
	}
	return c.JSON(utils.SuccessResponse[[]models.CategoryDTO]{ Data: tree })
}

func (h *CategoryHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil {
		return err
	}
	return utils.Success(c, item)
}

func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var body models.CategoryCreate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Create(c.Context(), body)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.CategoryDTO]{
		Data: *item,
	})
}

func (h *CategoryHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.CategoryUpdate
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("INVALID_BODY", "Invalid request body", err)
	}

	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil {
		return err
	}

	return utils.Success(c, item)
}

func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}
	return utils.NoContent(c)
} 