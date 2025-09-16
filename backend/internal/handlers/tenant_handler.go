package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type TenantHandler struct { svc *services.TenantService }

func NewTenantHandler(svc *services.TenantService) *TenantHandler { return &TenantHandler{svc: svc} }

func (h *TenantHandler) Register(r fiber.Router) {
	r.Get("/tenants", h.List)
	r.Get("/tenants/:id", h.Get)
	r.Post("/tenants", h.Create)
	r.Patch("/tenants/:id", h.Update)
	// management actions
	r.Post("/tenants/:id/freeze", h.Freeze)
	r.Post("/tenants/:id/unfreeze", h.Unfreeze)
	// stats
	r.Get("/tenants/:id/stats", h.Stats)
}

// Register tenant-scoped endpoints (require tenant middleware)
func (h *TenantHandler) RegisterCurrent(r fiber.Router) {
	r.Get("/tenant/current", h.GetCurrent)
	r.Patch("/tenant/current", h.UpdateCurrent)
}

func (h *TenantHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	items, total, err := h.svc.List(c.Context(), page, limit, search)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.Tenant]]{ Data: utils.Paginated[models.Tenant]{ Items: items, Total: total } })
}

func (h *TenantHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *TenantHandler) Create(c *fiber.Ctx) error {
	var body models.Tenant
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Create(c.Context(), body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.Tenant]{ Data: *item })
}

func (h *TenantHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.Tenant
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *TenantHandler) Freeze(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.SetStatus(c.Context(), id, models.TenantStatusSuspended); err != nil { return err }
	return utils.Success(c, fiber.Map{"ok": true})
}

func (h *TenantHandler) Unfreeze(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.SetStatus(c.Context(), id, models.TenantStatusActive); err != nil { return err }
	return utils.Success(c, fiber.Map{"ok": true})
}

func (h *TenantHandler) Stats(c *fiber.Ctx) error {
	id := c.Params("id")
	stats, err := h.svc.Stats(c.Context(), id)
	if err != nil { return err }
	return utils.Success(c, stats)
}

// Tenant-scoped handlers
func (h *TenantHandler) GetCurrent(c *fiber.Ctx) error {
	v := c.Locals("tenant")
	if v == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	tenant := v.(*models.Tenant)
	return utils.Success(c, tenant)
}

func (h *TenantHandler) UpdateCurrent(c *fiber.Ctx) error {
	v := c.Locals("tenant")
	if v == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	tenant := v.(*models.Tenant)
	var body struct { Settings models.TenantSettings `json:"settings"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	payload := models.Tenant{ Settings: body.Settings }
	item, err := h.svc.Update(c.Context(), tenant.ID.Hex(), payload)
	if err != nil { return err }
	return utils.Success(c, item)
} 