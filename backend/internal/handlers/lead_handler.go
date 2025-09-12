package handlers

import (
	"fmt"
	"strconv"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type LeadHandler struct { svc *services.LeadService }

func NewLeadHandler(svc *services.LeadService) *LeadHandler { return &LeadHandler{ svc: svc } }

func (h *LeadHandler) Register(r fiber.Router) {
	r.Get("/leads", h.List)
	r.Get("/leads/:id", h.Get)
	r.Post("/leads", h.Create)
	r.Patch("/leads/:id", h.Update)
	r.Put("/leads/:id/status", h.UpdateStatus)
	r.Post("/leads/bulk-update", h.BulkUpdate)
	r.Get("/pipeline/stages", h.GetStages)
	r.Post("/pipeline/stages", h.CreateStage)
	r.Put("/pipeline/stages/reorder", h.ReorderStages)
	r.Delete("/pipeline/stages/:key", h.DeleteStage)
}

func (h *LeadHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	t := c.Locals("tenant_id")
	tidStr, _ := t.(string)
	tenantID, _ := primitive.ObjectIDFromHex(tidStr)
	filter := bson.M{}
	if search != "" { filter["title"] = bson.M{"$regex": search, "$options": "i"} }
	items, total, err := h.svc.List(c.Context(), tenantID, filter, page, limit, bson.D{})
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.LeadDTO]]{ Data: utils.Paginated[models.LeadDTO]{ Items: items, Total: total } })
}

func (h *LeadHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c.Context(), id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *LeadHandler) Create(c *fiber.Ctx) error {
	var body models.LeadCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	t := c.Locals("tenant_id")
	tidStr, _ := t.(string)
	tenantID, _ := primitive.ObjectIDFromHex(tidStr)
	item, err := h.svc.Create(c.Context(), tenantID, body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.LeadDTO]{ Data: *item })
}

func (h *LeadHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.LeadUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c.Context(), id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *LeadHandler) UpdateStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct{ Status string `json:"status"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	if err := h.svc.UpdateStatus(c.Context(), id, body.Status); err != nil { return err }
	return utils.SuccessMessage(c, "Status updated")
}

func (h *LeadHandler) BulkUpdate(c *fiber.Ctx) error {
	var body struct{ IDs []string `json:"ids"`; Update map[string]interface{} `json:"update"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	if err := h.svc.BulkUpdate(c.Context(), body.IDs, body.Update); err != nil { return err }
	return utils.SuccessMessage(c, "Bulk update applied")
}

func (h *LeadHandler) GetStages(c *fiber.Ctx) error {
	t := c.Locals("tenant_id")
	tidStr, _ := t.(string)
	fmt.Printf("DEBUG: /api/pipeline/stages called. tenant_id local=%v\n", tidStr)
	tenantID, _ := primitive.ObjectIDFromHex(tidStr)
	items, err := h.svc.GetStages(c.Context(), tenantID)
	if err != nil { return err }
	return utils.Success(c, items)
}

func (h *LeadHandler) CreateStage(c *fiber.Ctx) error {
	t := c.Locals("tenant_id"); tidStr, _ := t.(string); tenantID, _ := primitive.ObjectIDFromHex(tidStr)
	var body struct{ Key string `json:"key"`; Title string `json:"title"`; Order int `json:"order"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	if body.Key == "" || body.Title == "" { return utils.BadRequest("VALIDATION", "key and title are required", nil) }
	if err := h.svc.CreateStage(c.Context(), tenantID, body.Key, body.Title, body.Order); err != nil { return err }
	return utils.SuccessMessage(c, "Stage created")
}

func (h *LeadHandler) ReorderStages(c *fiber.Ctx) error {
	t := c.Locals("tenant_id"); tidStr, _ := t.(string); tenantID, _ := primitive.ObjectIDFromHex(tidStr)
	var body struct{ Keys []string `json:"keys"` }
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	if len(body.Keys) == 0 { return utils.BadRequest("VALIDATION", "keys required", nil) }
	if err := h.svc.ReorderStages(c.Context(), tenantID, body.Keys); err != nil { return err }
	return utils.SuccessMessage(c, "Stages reordered")
}

func (h *LeadHandler) DeleteStage(c *fiber.Ctx) error {
    t := c.Locals("tenant_id"); tidStr, _ := t.(string); tenantID, _ := primitive.ObjectIDFromHex(tidStr)
    key := c.Params("key")
    if key == "" { return utils.BadRequest("VALIDATION", "key required", nil) }
    if err := h.svc.DeleteStage(c.Context(), tenantID, key); err != nil { return err }
    return utils.SuccessMessage(c, "Stage deleted")
} 