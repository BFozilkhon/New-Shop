package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ShopServiceHandler struct { svc *services.ShopServiceService }

func NewShopServiceHandler(svc *services.ShopServiceService) *ShopServiceHandler { return &ShopServiceHandler{ svc: svc } }

func (h *ShopServiceHandler) Register(r fiber.Router) {
	r.Get("/shop/services", h.List)
	r.Get("/shop/services/:id", h.Get)
	r.Post("/shop/services", h.Create)
	r.Patch("/shop/services/:id", h.Update)
	r.Delete("/shop/services/:id", h.Delete)
}

func (h *ShopServiceHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	customerID := c.Query("customer_id", "")
	tenantID, _ := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), page, limit, search, tenantID, customerID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ShopServiceDTO]]{ Data: utils.Paginated[models.ShopServiceDTO]{ Items: items, Total: total } })
}

func (h *ShopServiceHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopServiceHandler) Create(c *fiber.Ctx) error {
	var body models.ShopServiceCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ShopServiceDTO]{ Data: *item })
}

func (h *ShopServiceHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ShopServiceUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopServiceHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
} 