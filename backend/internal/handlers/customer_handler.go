package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type CustomerHandler struct { svc *services.CustomerService }

func NewCustomerHandler(svc *services.CustomerService) *CustomerHandler { return &CustomerHandler{ svc: svc } }

func (h *CustomerHandler) Register(r fiber.Router) {
	r.Get("/customers", h.List)
	r.Get("/customers/:id", h.Get)
	r.Post("/customers", h.Create)
	r.Patch("/customers/:id", h.Update)
	r.Delete("/customers/:id", h.Delete)
}

func (h *CustomerHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID, _ := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), page, limit, search, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.CustomerDTO]]{ Data: utils.Paginated[models.CustomerDTO]{ Items: items, Total: total } })
}

func (h *CustomerHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *CustomerHandler) Create(c *fiber.Ctx) error {
	var body models.CustomerCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Create(c.Context(), body, tenantID)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.CustomerDTO]{ Data: *item })
}

func (h *CustomerHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.CustomerUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID, _ := c.Locals("tenant_id").(string)
	item, err := h.svc.Update(c.Context(), id, body, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *CustomerHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID, _ := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
} 