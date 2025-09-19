package routes

import (
	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/handlers"
	"shop/backend/internal/middleware"
)

func Register(app *fiber.App, roles *handlers.RoleHandler, users *handlers.UserHandler, auth *handlers.AuthHandler, suppliers *handlers.SupplierHandler, tenants *handlers.TenantHandler, billing *handlers.BillingHandler) {
	api := app.Group("/api")
	// public
	auth.Register(api)
	// protected (no tenant middleware)
	protected := api.Group("", middleware.Current.AuthRequired())
	auth.RegisterProtected(protected)
	roles.Register(protected)
	users.Register(protected)
	// suppliers endpoints require tenant context; registered in RegisterWithTenant only
	// global (superadmin) tenants management
	tenants.Register(protected)
	// billing (global)
	billing.Register(protected)
	// Public static uploads (needed for <img src>)
	app.Static("/uploads", "/data/uploads")
}

func RegisterWithTenant(app *fiber.App, roles *handlers.RoleHandler, users *handlers.UserHandler, auth *handlers.AuthHandler, suppliers *handlers.SupplierHandler, tenants *handlers.TenantHandler, tenantResolver *middleware.TenantResolver, companies *handlers.CompanyHandler, stores *handlers.StoreHandler, categories *handlers.CategoryHandler, attributes *handlers.AttributeHandler, characteristics *handlers.CharacteristicHandler, brands *handlers.BrandHandler, warehouses *handlers.WarehouseHandler, parameters *handlers.ParameterHandler, products *handlers.ProductHandler, upload *handlers.UploadHandler, leads *handlers.LeadHandler, customers *handlers.CustomerHandler, orders *handlers.OrderHandler, shopCustomers *handlers.ShopCustomerHandler, shopUnits *handlers.ShopUnitHandler, shopVendors *handlers.ShopVendorHandler, shopServices *handlers.ShopServiceHandler, shopContacts *handlers.ShopContactHandler, importHistory *handlers.ImportHistoryHandler, inventories *handlers.InventoryHandler, writeoffs *handlers.WriteOffHandler, repricings *handlers.RepricingHandler, transfers *handlers.TransferHandler, pricetags *handlers.PriceTagHandler, exchangeRates *handlers.ExchangeRateHandler) {
	api := app.Group("/api")
	auth.Register(api)
	protected := api.Group("", middleware.Current.AuthRequired(), tenantResolver.Resolve())
	auth.RegisterProtected(protected)
	roles.Register(protected)
	users.Register(protected)
	suppliers.Register(protected)
	// tenants endpoints are global-only for superadmin; do not register here
	// Register tenant-scoped current endpoints instead
	tenants.RegisterCurrent(protected)
	companies.Register(protected)
	stores.Register(protected)
	categories.Register(protected)
	attributes.Register(protected)
	characteristics.Register(protected)
	brands.Register(protected)
	warehouses.Register(protected)
	parameters.Register(protected)
	products.Register(protected)
	upload.Register(protected)
	leads.Register(protected)
	customers.Register(protected)
	orders.Register(protected)
	shopCustomers.Register(protected)
	shopUnits.Register(protected)
	shopVendors.Register(protected)
	shopServices.Register(protected)
	shopContacts.Register(protected)
	importHistory.Register(protected)
	inventories.Register(protected)
	writeoffs.Register(protected)
	repricings.Register(protected)
	transfers.Register(protected)
	pricetags.Register(protected)
	exchangeRates.Register(protected)
	// Public static uploads (needed for <img src>)
	app.Static("/uploads", "/data/uploads")
} 