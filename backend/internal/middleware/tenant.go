package middleware

import (
	"net"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
)

type TenantResolver struct{ tenants *repositories.TenantRepository }

func NewTenantResolver(repo *repositories.TenantRepository) *TenantResolver { return &TenantResolver{ tenants: repo } }

func (t *TenantResolver) Resolve() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1) Header first: X-Tenant-ID may be objectId or subdomain key
		if tid := c.Get("X-Tenant-ID"); tid != "" {
			// try as ObjectID
			if oid, err := primitive.ObjectIDFromHex(tid); err == nil {
				if tenant, err2 := t.tenants.Get(c.Context(), oid); err2 == nil {
					c.Locals("tenant", tenant)
					c.Locals("tenant_id", tenant.ID.Hex())
					if s := c.Get("X-Store-ID"); s != "" { c.Locals("store_id", s) }
					return c.Next()
				}
			}
			// fallback as subdomain key
			if tenant, err := t.tenants.GetBySubdomain(c.Context(), tid); err == nil {
				c.Locals("tenant", tenant)
				c.Locals("tenant_id", tenant.ID.Hex())
				if s := c.Get("X-Store-ID"); s != "" { c.Locals("store_id", s) }
				return c.Next()
			}
		}
		// 2) Derive from request hostname subdomain (dev/prod with subdomains)
		host := c.Hostname()
		sub := extractSubdomain(host)
		if sub != "" {
			if tenant, err := t.tenants.GetBySubdomain(c.Context(), sub); err == nil {
				c.Locals("tenant", tenant)
				c.Locals("tenant_id", tenant.ID.Hex())
				if s := c.Get("X-Store-ID"); s != "" { c.Locals("store_id", s) }
				return c.Next()
			}
		}
		// 3) Optional dev fallback to "demo" if seeded
		if tenant, err := t.tenants.GetBySubdomain(c.Context(), "demo"); err == nil {
			c.Locals("tenant", tenant)
			c.Locals("tenant_id", tenant.ID.Hex())
			if s := c.Get("X-Store-ID"); s != "" { c.Locals("store_id", s) }
			return c.Next()
		}
		return utils.BadRequest("TENANT_REQUIRED", "Tenant not resolved", nil)
	}
}

func extractSubdomain(host string) string {
	// remove port if present
	if h, _, err := net.SplitHostPort(host); err == nil { host = h }
	parts := strings.Split(host, ".")
	if len(parts) >= 3 { return parts[0] }
	return ""
} 