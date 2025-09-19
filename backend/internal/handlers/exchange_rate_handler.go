package handlers

import (
	"strconv"
	"time"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type ExchangeRateHandler struct { svc *services.ExchangeRateService }

func NewExchangeRateHandler(svc *services.ExchangeRateService) *ExchangeRateHandler { return &ExchangeRateHandler{svc: svc} }

func (h *ExchangeRateHandler) Register(r fiber.Router) {
	r.Get("/exchange-rates", h.List)
	r.Post("/exchange-rates", h.Create)
	r.Get("/exchange-rates/at", h.GetAt)
}

func (h *ExchangeRateHandler) List(c *fiber.Ctx) error {
	v := c.Locals("tenant")
	if v == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	tenant := v.(*models.Tenant)
	page, _ := strconv.ParseInt(c.Query("page","1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit","20"), 10, 64)
	items, total, err := h.svc.List(c.Context(), tenant.ID.Hex(), page, limit)
	if err != nil { return err }
	return utils.Success(c, fiber.Map{"items": items, "total": total})
}

func (h *ExchangeRateHandler) Create(c *fiber.Ctx) error {
	v := c.Locals("tenant")
	if v == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	tenant := v.(*models.Tenant)
	var body models.ExchangeRateCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	user := c.Locals("user")
	createdBy := ""
	if user != nil { if u, ok := user.(interface{ GetID() string }); ok { createdBy = u.GetID() } }
	dto, err := h.svc.Create(c.Context(), tenant.ID.Hex(), body, createdBy)
	if err != nil { return err }
	return c.Status(201).JSON(utils.SuccessResponse[interface{}]{ Data: dto })
}

func (h *ExchangeRateHandler) GetAt(c *fiber.Ctx) error {
	v := c.Locals("tenant")
	if v == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil) }
	tenant := v.(*models.Tenant)
	atStr := c.Query("at", "")
	var at time.Time
	if atStr == "" { at = time.Now().UTC() } else {
		// try RFC3339 then date-only
		if ts, err := time.Parse(time.RFC3339, atStr); err == nil { at = ts } else if ts2, err2 := time.Parse("2006-01-02", atStr); err2 == nil { at = ts2 } else { return utils.BadRequest("INVALID_DATE", "Invalid date format", nil) }
	}
	dto, err := h.svc.GetAt(c.Context(), tenant.ID.Hex(), at)
	if err != nil { return err }
	return utils.Success(c, dto)
} 