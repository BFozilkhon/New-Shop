package handlers

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type RepricingHandler struct { svc *services.RepricingService }

func NewRepricingHandler(svc *services.RepricingService) *RepricingHandler { return &RepricingHandler{ svc: svc } }

func (h *RepricingHandler) Register(r fiber.Router) {
	r.Get("/repricings", h.List)
	r.Get("/repricings/:id", h.Get)
	r.Post("/repricings", h.Create)
	r.Patch("/repricings/:id", h.Update)
	r.Delete("/repricings/:id", h.Delete)
}

func (h *RepricingHandler) List(c *fiber.Ctx) error {
	var p repositories.RepricingListParams
	_ = c.QueryParser(&p)
	p.TenantID = c.Get("X-Tenant-ID")
	// ensure shop_id from query is captured (QueryParser may not map snake_case)
	if p.ShopID == "" { p.ShopID = c.Query("shop_id", "") }
	items, total, err := h.svc.List(c.Context(), p)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.Repricing]]{ Data: utils.Paginated[models.Repricing]{ Items: items, Total: total } })
}

func (h *RepricingHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Get("X-Tenant-ID")
	m, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Repricing]{ Data: *m })
}

func (h *RepricingHandler) Create(c *fiber.Ctx) error {
	var body models.CreateRepricingRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	createdBy := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { createdBy = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	m, err := h.svc.Create(c.Context(), body, c.Get("X-Tenant-ID"), createdBy)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Repricing]{ Data: *m })
}

func (h *RepricingHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UpdateRepricingRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid payload", err) }
	vuser := c.Locals("user")
	actor := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { actor = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	m, err := h.svc.Update(c.Context(), id, body, c.Get("X-Tenant-ID"), actor)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[models.Repricing]{ Data: *m })
}

func (h *RepricingHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c.Context(), id, c.Get("X-Tenant-ID")); err != nil { return err }
	return c.JSON(utils.SuccessResponse[string]{ Data: "ok" })
} 