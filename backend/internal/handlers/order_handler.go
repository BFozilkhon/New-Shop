package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type OrderHandler struct { svc *services.OrderService }

func NewOrderHandler(svc *services.OrderService) *OrderHandler { return &OrderHandler{ svc: svc } }

func (h *OrderHandler) Register(r fiber.Router) {
	r.Get("/orders", h.List)
	r.Get("/orders/:id", h.Get)
	r.Post("/orders", h.Create)
	r.Patch("/orders/:id", h.Update)
	r.Delete("/orders/:id", h.Delete)
	r.Post("/orders/:id/payments", h.AddPayment)
}

func (h *OrderHandler) List(c *fiber.Ctx) error {
	var f models.OrderFilterRequest
	// allow query based filtering
	f.Search = c.Query("search", "")
	f.StatusID = c.Query("status_id", "")
	f.SupplierID = c.Query("supplier_id", "")
	f.ShopID = c.Query("shop_id", "")
	f.CreatedBy = c.Query("created_by", "")
	f.DateFrom = c.Query("date_from", "")
	f.DateTo = c.Query("date_to", "")
	f.PaymentStatus = c.Query("payment_status", "")
	f.Type = c.Query("type", "")
	f.SortBy = c.Query("sort_by", "created_at")
	f.SortOrder = c.Query("sort_order", "desc")
	if p, err := strconv.Atoi(c.Query("page", "1")); err == nil { f.Page = p }
	if l, err := strconv.Atoi(c.Query("limit", "20")); err == nil { f.Limit = l }

	tenantID := c.Locals("tenant_id").(string)
	items, total, err := h.svc.List(c.Context(), f, tenantID)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.Order]]{ Data: utils.Paginated[models.Order]{ Items: items, Total: total } })
}

func (h *OrderHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	item, err := h.svc.Get(c.Context(), id, tenantID)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *OrderHandler) Create(c *fiber.Ctx) error {
	var body models.CreateOrderRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	vuser := c.Locals("user")
	createdBy := models.OrderUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { createdBy = models.OrderUser{ ID: u.ID.Hex(), Name: u.Name } } }
	item, err := h.svc.Create(c.Context(), body, tenantID, createdBy)
	if err != nil { return err }
	return utils.Created(c, item)
}

func (h *OrderHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.UpdateOrderRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	tenantID := c.Locals("tenant_id").(string)
	vuser := c.Locals("user")
	user := models.OrderUser{}
	if vuser != nil { if u, ok := vuser.(*models.User); ok { user = models.OrderUser{ ID: u.ID.Hex(), Name: u.Name } } }
	item, err := h.svc.Update(c.Context(), id, body, tenantID, user)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *OrderHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	if err := h.svc.Delete(c.Context(), id, tenantID); err != nil { return err }
	return utils.NoContent(c)
}

func (h *OrderHandler) AddPayment(c *fiber.Ctx) error {
	id := c.Params("id")
	tenantID := c.Locals("tenant_id").(string)
	var body models.AddOrderPaymentRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.AddPayment(c.Context(), id, tenantID, body)
	if err != nil { return err }
	return utils.Success(c, item)
} 