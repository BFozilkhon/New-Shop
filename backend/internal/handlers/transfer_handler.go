package handlers

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type TransferHandler struct { svc *services.TransferService }

func NewTransferHandler(svc *services.TransferService) *TransferHandler { return &TransferHandler{ svc: svc } }

func (h *TransferHandler) Register(r fiber.Router) {
	r.Get("/transfers", h.List)
	r.Get("/transfers/:id", h.Get)
	r.Post("/transfers", h.Create)
	r.Patch("/transfers/:id", h.Update)
	r.Delete("/transfers/:id", h.Delete)
}

func (h *TransferHandler) List(c *fiber.Ctx) error {
	var f models.TransferFilterRequest
	_ = c.QueryParser(&f)
	tenantID := c.Get("X-Tenant-ID")
	items, total, err := h.svc.List(c.Context(), f, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.Transfer]]{ Data: utils.Paginated[models.Transfer]{ Items: items, Total: total } })
}

func (h *TransferHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Transfer]{ Data: *m })
}

func (h *TransferHandler) Create(c *fiber.Ctx) error {
	var body models.CreateTransferRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	createdBy := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { createdBy = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Create(c.Context(), body, tenantID, createdBy)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Transfer]{ Data: *m })
}

func (h *TransferHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UpdateTransferRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	actor := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { actor = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Update(c.Context(), id, body, tenantID, actor)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Transfer]{ Data: *m })
}

func (h *TransferHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Get("X-Tenant-ID")
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return c.JSON(utils.SuccessResponse[string]{ Data: "ok" })
} 