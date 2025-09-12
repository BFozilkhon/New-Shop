package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type PriceTagHandler struct { svc *services.PriceTagService }

func NewPriceTagHandler(svc *services.PriceTagService) *PriceTagHandler { return &PriceTagHandler{ svc: svc } }

func (h *PriceTagHandler) Register(r fiber.Router) {
	r.Get("/pricetags", h.List)
	r.Get("/pricetags/:id", h.Get)
	r.Post("/pricetags", h.Create)
	r.Patch("/pricetags/:id", h.Update)
	r.Delete("/pricetags/:id", h.Delete)
}

func (h *PriceTagHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), tenantID, page, limit, search)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.PriceTagTemplate]]{ Data: utils.Paginated[models.PriceTagTemplate]{ Items: items, Total: total } })
}

func (h *PriceTagHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	m, err := h.svc.Get(c.Context(), id, tenantID); if err != nil { return err }
	return utils.Success(c, m)
}

func (h *PriceTagHandler) Create(c *fiber.Ctx) error {
	var body models.PriceTagTemplateCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	m, err := h.svc.Create(c.Context(), body, tenantID); if err != nil { return err }
	return utils.Created(c, m)
}

func (h *PriceTagHandler) Update(c *fiber.Ctx) error {
	var body models.PriceTagTemplateUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	m, err := h.svc.Update(c.Context(), c.Params("id"), body, tenantID); if err != nil { return err }
	return utils.Success(c, m)
}

func (h *PriceTagHandler) Delete(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), c.Params("id"), tenantID); err != nil { return err }
	return utils.NoContent(c)
} 