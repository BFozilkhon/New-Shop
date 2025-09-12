package handlers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type StatsHandler struct { svc *services.StatsService }

func NewStatsHandler(svc *services.StatsService) *StatsHandler { return &StatsHandler{ svc: svc } }

func (h *StatsHandler) Register(r fiber.Router) {
	r.Get("/stats/summary", h.Summary)
	r.Get("/stats/monthly", h.Monthly)
}

func (h *StatsHandler) Summary(c *fiber.Ctx) error {
	res, err := h.svc.Summary(c.Context())
	if err != nil { return err }
	return utils.Success(c, res)
}

func (h *StatsHandler) Monthly(c *fiber.Ctx) error {
	months, _ := strconv.Atoi(c.Query("months", "12"))
	res, err := h.svc.MonthlyRevenue(c.Context(), months)
	if err != nil { return err }
	return utils.Success(c, res)
} 