package handlers

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/models"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
)

type AuthHandler struct { svc *services.AuthService }

func NewAuthHandler(svc *services.AuthService) *AuthHandler { return &AuthHandler{svc: svc} }

// Register only public endpoints
func (h *AuthHandler) Register(r fiber.Router) { r.Post("/auth/login", h.Login) }

// RegisterProtected attaches endpoints that require auth middleware
func (h *AuthHandler) RegisterProtected(r fiber.Router) { r.Get("/auth/me", h.Me) }

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest("INVALID_BODY", "Invalid request body", err) }
	resp, err := h.svc.Login(c.Context(), req.Email, req.Password)
	if err != nil { return err }
	return utils.Success(c, resp)
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	v := c.Locals("user")
	if v == nil { return utils.Unauthorized("UNAUTHORIZED", "Unauthorized", nil) }
	u := v.(*models.User)
	dto, perms, _ := h.svc.BuildUserDTO(c.Context(), u)
	return c.JSON(fiber.Map{"data": fiber.Map{"user": dto, "permissions": perms}})
} 