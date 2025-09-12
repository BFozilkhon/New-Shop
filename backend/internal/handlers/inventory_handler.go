package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type InventoryHandler struct { svc *services.InventoryService }

func NewInventoryHandler(svc *services.InventoryService) *InventoryHandler { return &InventoryHandler{ svc: svc } }

func (h *InventoryHandler) Register(r fiber.Router) {
	r.Get("/inventories", h.List)
	r.Get("/inventories/:id", h.Get)
	r.Post("/inventories", h.Create)
	r.Patch("/inventories/:id", h.Update)
	r.Delete("/inventories/:id", h.Delete)
}

func (h *InventoryHandler) List(c *fiber.Ctx) error {
	var f models.InventoryFilterRequest
	f.Search = c.Query("search", "")
	f.ShopID = c.Query("shop_id", "")
	f.StatusID = c.Query("status_id", "")
	f.Type = c.Query("type", "")
	f.SortBy = c.Query("sort_by", "created_at")
	f.SortOrder = c.Query("sort_order", "desc")
	if p, err := strconv.Atoi(c.Query("page", "1")); err == nil { f.Page = p }
	if l, err := strconv.Atoi(c.Query("limit", "20")); err == nil { f.Limit = l }
	f.DateFrom = c.Query("date_from", "")
	f.DateTo = c.Query("date_to", "")
	tenantID := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), f, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.Inventory]]{ Data: utils.Paginated[models.Inventory]{ Items: items, Total: total } })
}

func (h *InventoryHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *InventoryHandler) Create(c *fiber.Ctx) error {
	var body models.CreateInventoryRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	vuser := c.Locals("user")
	createdBy := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { createdBy = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	item, err := h.svc.Create(c.Context(), body, tenantID, createdBy)
	if err != nil { return err }
	return utils.Created(c, item)
}

func (h *InventoryHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UpdateInventoryRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	vuser := c.Locals("user")
	user := models.InventoryUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { user = models.InventoryUser{ ID: u.ID.Hex(), Name: u.Name } } }
	item, err := h.svc.Update(c.Context(), id, body, tenantID, user)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *InventoryHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
} 