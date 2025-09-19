package handlers

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
	"strconv"
)

type ImportHistoryHandler struct { svc *services.ImportHistoryService }

func NewImportHistoryHandler(svc *services.ImportHistoryService) *ImportHistoryHandler { return &ImportHistoryHandler{svc: svc} }

func (h *ImportHistoryHandler) Register(protected fiber.Router) {
	grp := protected.Group("/import-history")
	grp.Get("/products", h.List)
	grp.Post("/products", h.Create)
	grp.Get("/products/:id", h.Get)
}

func (h *ImportHistoryHandler) List(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	p, _ := strconv.Atoi(c.Query("page", "1"))
	l, _ := strconv.Atoi(c.Query("limit", "20"))
	storeID := c.Query("store_id", "")
	items, total, err := h.svc.List(c.Context(), tenantID.(string), int64(p), int64(l), storeID)
	if err != nil { return err }
	return utils.Success(c, utils.Paginated[models.ImportHistoryDTO]{ Items: items, Total: total })
}

func (h *ImportHistoryHandler) Create(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	user := c.Locals("user")
	userID := ""
	if user != nil { userID = (user.(*models.User)).ID.Hex() }
	var body models.CreateImportHistoryRequest
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid body", err) }
	if body.FileName == "" { body.FileName = "Import" }
	if body.Status == "" { body.Status = "completed" }
	created, err := h.svc.Create(c.Context(), tenantID.(string), userID, body)
	if err != nil { return err }
	return utils.Created(c, created)
}

func (h *ImportHistoryHandler) Get(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id")
	if tenantID == nil { return utils.BadRequest("TENANT_REQUIRED", "Tenant required", nil) }
	id := c.Params("id")
	res, err := h.svc.Get(c.Context(), tenantID.(string), id)
	if err != nil { return err }
	return utils.Success(c, res)
} 