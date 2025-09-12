package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ShopVendorHandler struct { svc *services.ShopVendorService }

func NewShopVendorHandler(svc *services.ShopVendorService) *ShopVendorHandler { return &ShopVendorHandler{ svc: svc } }

func (h *ShopVendorHandler) Register(r fiber.Router) {
	r.Get("/shop/vendors", h.List)
	r.Get("/shop/vendors/:id", h.Get)
	r.Post("/shop/vendors", h.Create)
	r.Patch("/shop/vendors/:id", h.Update)
	r.Delete("/shop/vendors/:id", h.Delete)
}

func (h *ShopVendorHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID, _ := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), page, limit, search, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ShopVendorDTO]]{ Data: utils.Paginated[models.ShopVendorDTO]{ Items: items, Total: total } })
}

func (h *ShopVendorHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopVendorHandler) Create(c *fiber.Ctx) error {
	var body models.ShopVendorCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ShopVendorDTO]{ Data: *item })
}

func (h *ShopVendorHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ShopVendorUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopVendorHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
} 