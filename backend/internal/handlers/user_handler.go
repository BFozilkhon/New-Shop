package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type UserHandler struct { svc *services.UserService }

func NewUserHandler(svc *services.UserService) *UserHandler { return &UserHandler{svc: svc} }

func (h *UserHandler) Register(r fiber.Router) { 
	r.Get("/users", h.List)
	r.Get("/users/:id", h.Get)
	r.Post("/users", h.Create)
	r.Patch("/users/:id", h.Update)
	r.Delete("/users/:id", h.Delete)
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	roleKey := c.Query("role_key", "")
	var isActivePtr *bool; if v := c.Query("is_active", ""); v != "" { b := v == "true" || v == "1"; isActivePtr = &b }
	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr, roleKey)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.UserDTO]]{ Data: utils.Paginated[models.UserDTO]{ Items: items, Total: total } })
}

func (h *UserHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var body models.UserCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Create(c.Context(), body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.UserDTO]{ Data: *item })
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UserUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil { return err }
	return utils.NoContent(c)
} 