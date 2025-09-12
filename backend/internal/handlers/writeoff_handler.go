package handlers

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type WriteOffHandler struct { svc *services.WriteOffService }

func NewWriteOffHandler(svc *services.WriteOffService) *WriteOffHandler { return &WriteOffHandler{ svc: svc } }

func (h *WriteOffHandler) Register(r fiber.Router) {
	r.Get("/writeoffs", h.List)
	r.Get("/writeoffs/:id", h.Get)
	r.Post("/writeoffs", h.Create)
	r.Patch("/writeoffs/:id", h.Update)
	r.Delete("/writeoffs/:id", h.Delete)
}

func (h *WriteOffHandler) List(c *fiber.Ctx) error {
	var f models.WriteOffFilterRequest
	_ = c.QueryParser(&f)
	// fallback when snake_case not bound
	if f.ShopID == "" { f.ShopID = c.Query("shop_id", "") }
	tenantID := c.Get("X-Tenant-ID")
	items, total, err := h.svc.List(c.Context(), f, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.WriteOff]]{ Data: utils.Paginated[models.WriteOff]{ Items: items, Total: total } })
}

func (h *WriteOffHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.WriteOff]{ Data: *m })
}

func (h *WriteOffHandler) Create(c *fiber.Ctx) error {
	var body models.CreateWriteOffRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	createdBy := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { createdBy = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Create(c.Context(), body, tenantID, createdBy)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.WriteOff]{ Data: *m })
}

func (h *WriteOffHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UpdateWriteOffRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	actor := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { actor = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Update(c.Context(), id, body, tenantID, actor)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.WriteOff]{ Data: *m })
}

func (h *WriteOffHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Get("X-Tenant-ID")
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return c.JSON(utils.SuccessResponse[string]{ Data: "ok" })
} 