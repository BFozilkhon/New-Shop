package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type CompanyHandler struct { svc *services.CompanyService }

type StoreHandler struct { svc *services.StoreService }

func NewCompanyHandler(svc *services.CompanyService) *CompanyHandler { return &CompanyHandler{svc: svc} }
func NewStoreHandler(svc *services.StoreService) *StoreHandler { return &StoreHandler{svc: svc} }

func (h *CompanyHandler) Register(r fiber.Router) {
	r.Get("/companies", h.List)
	r.Get("/companies/:id", h.Get)
	r.Post("/companies", h.Create)
	r.Patch("/companies/:id", h.Update)
	r.Delete("/companies/:id", h.Delete)
}

func (h *CompanyHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	items, total, err := h.svc.List(c, page, limit, search)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.CompanyDTO]]{ Data: utils.Paginated[models.CompanyDTO]{ Items: items, Total: total } })
}

func (h *CompanyHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c, id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *CompanyHandler) Create(c *fiber.Ctx) error {
	var body models.CompanyCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Create(c, body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.CompanyDTO]{ Data: *item })
}

func (h *CompanyHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.CompanyUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c, id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *CompanyHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c, id); err != nil { return err }
	return utils.NoContent(c)
}

func (h *StoreHandler) Register(r fiber.Router) {
	r.Get("/stores", h.List)
	r.Get("/stores/:id", h.Get)
	r.Post("/stores", h.Create)
	r.Patch("/stores/:id", h.Update)
	r.Delete("/stores/:id", h.Delete)
}

func (h *StoreHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	search := c.Query("search", "")
	var companyID *string; if v := c.Query("company_id", ""); v != "" { companyID = &v }
	items, total, err := h.svc.List(c, companyID, page, limit, search)
	if err != nil { return err }
	return c.JSON(utils.SuccessResponse[utils.Paginated[models.StoreDTO]]{ Data: utils.Paginated[models.StoreDTO]{ Items: items, Total: total } })
}

func (h *StoreHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := h.svc.Get(c, id)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *StoreHandler) Create(c *fiber.Ctx) error {
	var body models.StoreCreate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Create(c, body)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(utils.SuccessResponse[models.StoreDTO]{ Data: *item })
}

func (h *StoreHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body models.StoreUpdate
	if err := c.BodyParser(&body); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	item, err := h.svc.Update(c, id, body)
	if err != nil { return err }
	return utils.Success(c, item)
}

func (h *StoreHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(c, id); err != nil { return err }
	return utils.NoContent(c)
} 