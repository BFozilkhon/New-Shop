package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ShopCustomerHandler struct { svc *services.ShopCustomerService }

func NewShopCustomerHandler(svc *services.ShopCustomerService) *ShopCustomerHandler { return &ShopCustomerHandler{ svc: svc } }

func (h *ShopCustomerHandler) Register(r fiber.Router) {
	r.Get("/shop/customers", h.List)
	r.Get("/shop/customers/:id", h.Get)
	r.Post("/shop/customers", h.Create)
	r.Patch("/shop/customers/:id", h.Update)
	r.Delete("/shop/customers/:id", h.Delete)
	r.Get("/shop/labor-rates", h.LaborRates)
}

func (h *ShopCustomerHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID, _ := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), page, limit, search, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.ShopCustomerDTO]]{ Data: utils.Paginated[models.ShopCustomerDTO]{ Items: items, Total: total } })
}

func (h *ShopCustomerHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopCustomerHandler) Create(c *fiber.Ctx) error {
	var body models.ShopCustomerCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.ShopCustomerDTO]{ Data: *item })
}

func (h *ShopCustomerHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.ShopCustomerUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *ShopCustomerHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
}

func (h *ShopCustomerHandler) LaborRates(c *fiber.Ctx) error {
	rates, err := h.svc.LaborRates(c.Context())
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[[]string]{ Data: rates })
} 