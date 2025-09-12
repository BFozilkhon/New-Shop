package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ShopUnitHandler struct { svc *services.ShopUnitService }

func NewShopUnitHandler(svc *services.ShopUnitService) *ShopUnitHandler { return &ShopUnitHandler{ svc: svc } }

func (h *ShopUnitHandler) Register(r fiber.Router) {
	r.Get("/shop/units", h.List)
	r.Get("/shop/units/:id", h.Get)
	r.Post("/shop/units", h.Create)
	r.Patch("/shop/units/:id", h.Update)
	r.Delete("/shop/units/:id", h.Delete)
}

func (h *ShopUnitHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	customerID := c.Query("customer_id", "")
	if customerID == "" { return utils.BadRequest("VALIDATION_ERROR", "customer_id is required", nil) }
	tenantID := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), page, limit, search, tenantID, customerID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ShopUnitDTO]]{ Data: utils.Paginated[models.ShopUnitDTO]{ Items: items, Total: total } })
}

func (h *ShopUnitHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopUnitHandler) Create(c *fiber.Ctx) error {
	var body models.ShopUnitCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ShopUnitDTO]{ Data: *item })
}

func (h *ShopUnitHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ShopUnitUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopUnitHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
} 