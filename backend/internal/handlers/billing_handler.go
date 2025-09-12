package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type BillingHandler struct { payments *services.PaymentService }

func NewBillingHandler(pay *services.PaymentService) *BillingHandler { return &BillingHandler{ payments: pay } }

func (h *BillingHandler) Register(r fiber.Router) {
	r.Get("/billing/payments", h.ListPayments)
	r.Post("/billing/payments", h.CreatePayment)
}

func (h *BillingHandler) ListPayments(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	tenantID := c.Query("tenant_id", "")
	items, total, err := h.payments.List(c.Context(), services.PaymentListParams{ Page: page, Limit: limit, Search: search, TenantID: tenantID })
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.PaymentDTO]]{ Data: utils.Paginated[models.PaymentDTO]{ Items: items, Total: total } })
}

func (h *BillingHandler) CreatePayment(c *fiber.Ctx) error {
	var body models.PaymentCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.payments.Create(c.Context(), body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.Payment]{ Data: *item })
} 