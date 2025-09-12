package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type RoleHandler struct { svc *services.RoleService }

func NewRoleHandler(svc *services.RoleService) *RoleHandler { return &RoleHandler{svc: svc} }

func (h *RoleHandler) Register(r fiber.Router) { 
	r.Get("/roles", h.List)
	r.Get("/roles/:id", h.Get)
	r.Post("/roles", h.Create)
	r.Patch("/roles/:id", h.Update)
	r.Delete("/roles/:id", h.Delete)
	r.Get("/permissions", h.Permissions)
}

func (h *RoleHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	var isActivePtr *bool; if v := c.Query("is_active", ""); v != "" { b := v == "true" || v == "1"; isActivePtr = &b }
	items, total, err := h.svc.List(c.Context(), page, limit, search, isActivePtr)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.RoleDTO]]{ Data: utils.Paginated[models.RoleDTO]{ Items: items, Total: total } })
}

func (h *RoleHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	dto, err := h.svc.Get(c.Context(), id)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.RoleDTO]{ Data: *dto })
}

func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var body models.RoleCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	dto, err := h.svc.Create(c.Context(), body)
	if err != nil { return err }
	return c.Status(201).JSON(utils.SuccessResponse[models.RoleDTO]{ Data: *dto })
}

func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.RoleUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	dto, err := h.svc.Update(c.Context(), id, body)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.RoleDTO]{ Data: *dto })
}

func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id); err != nil { return err }
	return c.JSON(utils.SuccessResponse[struct{}]{ Data: struct{}{} })
}

func (h *RoleHandler) Permissions(c *fiber.Ctx) error {
	groups, err := h.svc.Permissions(c.Context())
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[[]models.PermissionGroup]{ Data: groups })
} 