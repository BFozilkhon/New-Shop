package middleware

import (
	"strings"
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
	"shop/backend/internal/models"
)

type Authz struct {
	users *repositories.UserRepository
	roles *repositories.RoleRepository
}

var Current *Authz

func NewAuthz(users *repositories.UserRepository, roles *repositories.RoleRepository) *Authz {
	Current = &Authz{users: users, roles: roles}
	return Current
}

// AuthRequired parses a very simple token of the form "<userId>.<ts>" and loads the user.
func (a *Authz) AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authz := c.Get("Authorization")
		if authz == "" || !strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			return utils.Unauthorized("UNAUTHORIZED", "Missing token", nil)
		}
		tok := strings.TrimSpace(authz[len("Bearer "):])
		parts := strings.Split(tok, ".")
		if len(parts) < 1 || len(parts[0]) == 0 {
			return utils.Unauthorized("UNAUTHORIZED", "Invalid token", nil)
		}
		uidStr := parts[0]
		user, err := a.users.GetByIDHex(c.Context(), uidStr)
		if err != nil { return utils.Unauthorized("UNAUTHORIZED", "User not found", err) }
		c.Locals("user", user)
		return c.Next()
	}
}

func (a *Authz) CheckPermission(c *fiber.Ctx, perm string) error {
	vu := c.Locals("user")
	if vu == nil { return utils.Unauthorized("UNAUTHORIZED", "Unauthorized", nil) }
	u := vu.(*models.User)
	role, err := a.roles.Get(c.Context(), u.RoleID)
	if err != nil { return utils.Forbidden("PERMISSION_DENIED", "Role not found", err) }
	perms := map[string]struct{}{}
	for _, p := range role.Permissions { perms[p] = struct{}{} }
	if _, ok := perms[perm]; !ok { return utils.Forbidden("PERMISSION_DENIED", "Permission required", nil) }
	return nil
} 