package main

import (
	"context"
	"log"
	"time"
	"shop/backend/internal/config"
	"shop/backend/internal/handlers"
	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/routes"
	"shop/backend/internal/services"
	"shop/backend/internal/utils"
	"shop/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
	"net/url"
	"strings"
)

func seedDefaults(ctx context.Context, db *mongo.Database, logger *zap.Logger) error {
	// ensure demo tenant
	tenantsCol := db.Collection("tenants")
	var tenant models.Tenant
	if err := tenantsCol.FindOne(ctx, bson.M{"subdomain": "demo"}).Decode(&tenant); err != nil {
		tenant = models.Tenant{ Subdomain: "demo", CompanyName: "Demo", Email: "demo@example.com", Phone: "", Status: models.TenantStatusActive, Plan: models.PlanStarter, Settings: models.GetDefaultTenantSettings(), CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC() }
		res, err2 := tenantsCol.InsertOne(ctx, tenant); if err2 != nil { return err2 }
		tenant.ID = res.InsertedID.(primitive.ObjectID)
		logger.Info("seeded demo tenant", zap.String("subdomain", tenant.Subdomain))
	}

	rolesCol := db.Collection("roles")
	var role models.Role
	if err := rolesCol.FindOne(ctx, bson.M{"key": "admin", "is_deleted": false}).Decode(&role); err != nil {
		role = models.Role{Name: "Administrator", Key: "admin", IsActive: true, IsDeleted: false, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
		role.Permissions = []string{}
		res, err2 := rolesCol.InsertOne(ctx, role); if err2 != nil { return err2 }
		role.ID = res.InsertedID.(primitive.ObjectID)
		logger.Info("seeded default role", zap.String("key", role.Key))
	}

	// Build full permission list: for each permission base add .access/.create/.update/.delete
	// Pull bases from RoleService.Permissions() to keep in sync
	roleRepo := repositories.NewRoleRepository(db)
	roleSvc := services.NewRoleService(roleRepo)
	groups, _ := roleSvc.Permissions(ctx)
	bases := make([]string, 0, 128)
	for _, g := range groups {
		for _, it := range g.Items { bases = append(bases, it.Key) }
	}
	actions := []string{"access", "create", "update", "delete"}
	full := make([]string, 0, len(bases)*len(actions))
	for _, b := range bases {
		for _, a := range actions { full = append(full, b+"."+a) }
	}
	_, _ = rolesCol.UpdateOne(ctx, bson.M{"_id": role.ID}, bson.M{"$addToSet": bson.M{"permissions": bson.M{"$each": full}}, "$set": bson.M{"updated_at": time.Now().UTC()}})

	usersCol := db.Collection("users")
	var user models.User
	if err := usersCol.FindOne(ctx, bson.M{"email": "admin@example.com", "is_deleted": false}).Decode(&user); err != nil {
		hash, _ := utils.HashPassword("Admin@123")
		user = models.User{Name: "Admin", Email: "admin@example.com", PasswordHash: hash, RoleID: role.ID, IsActive: true, IsDeleted: false, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
		_, err2 := usersCol.InsertOne(ctx, user); if err2 != nil { return err2 }
		logger.Info("seeded default admin user", zap.String("email", user.Email))
	}

	// Superadmin role/user (global)
	var saRole models.Role
	if err := rolesCol.FindOne(ctx, bson.M{"key": "superadmin", "is_deleted": false}).Decode(&saRole); err != nil {
		saRole = models.Role{Name: "SuperAdmin", Key: "superadmin", Permissions: []string{"*"}, IsActive: true, IsDeleted: false, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
		res, err2 := rolesCol.InsertOne(ctx, saRole); if err2 == nil { saRole.ID = res.InsertedID.(primitive.ObjectID); logger.Info("seeded superadmin role") }
	}
	var saUser models.User
	if err := usersCol.FindOne(ctx, bson.M{"email": "super_admin@gmail.com", "is_deleted": false}).Decode(&saUser); err != nil {
		hash, _ := utils.HashPassword("super_admin123")
		saUser = models.User{Name: "Super Admin", Email: "super_admin@gmail.com", PasswordHash: hash, RoleID: saRole.ID, IsActive: true, IsDeleted: false, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
		_, _ = usersCol.InsertOne(ctx, saUser)
		logger.Info("seeded superadmin user")
	}
	return nil
}

func main() {
	cfg := config.Load()
	logger := utils.MustLogger(cfg.Env)
	defer func() { _ = logger.Sync() }()

	ctx := context.Background()
	client, err := config.NewMongoClient(ctx, cfg.MongoURI)
	if err != nil { logger.Fatal("mongo connect failed", zap.Error(err)) }
	db := client.Database(cfg.DBName)
	if err := config.EnsureIndexes(ctx, db); err != nil { logger.Fatal("ensure indexes failed", zap.Error(err)) }
	if err := seedDefaults(ctx, db, logger); err != nil { logger.Fatal("seed defaults failed", zap.Error(err)) }

	app := fiber.New(fiber.Config{ ErrorHandler: utils.FiberErrorHandler(logger), BodyLimit: 200 * 1024 * 1024 })
	app.Use(requestid.New())

	// Build an exact-allow list from FRONTEND_URL (comma-separated) and allow subdomains for production domain
	allowedExact := map[string]struct{}{}
	for _, origin := range strings.Split(cfg.FrontendURL, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" { allowedExact[trimmed] = struct{}{} }
	}

	// Fallback static CORS for simple cases (no wildcard subdomains)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.FrontendURL + ",http://134.209.218.206:5174,http://134.209.218.206,https://134.209.218.206,http://findest.uz,https://findest.uz,http://tss.findest.uz,https://tss.findest.uz",
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Tenant-ID, X-Store-ID",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))

	// Dynamic CORS for wildcard subdomains and IP (any port)
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if origin != "" {
			if _, ok := allowedExact[origin]; ok {
				c.Set("Access-Control-Allow-Origin", origin)
				c.Set("Vary", "Origin")
				c.Set("Access-Control-Allow-Credentials", "true")
				c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Tenant-ID, X-Store-ID")
				c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
				if c.Method() == fiber.MethodOptions { return c.SendStatus(fiber.StatusNoContent) }
				return c.Next()
			}
			u, err := url.Parse(origin)
			if err == nil {
				host := u.Hostname()
				if host == "134.209.218.206" || host == "findest.uz" || strings.HasSuffix(host, ".findest.uz") {
					c.Set("Access-Control-Allow-Origin", origin)
					c.Set("Vary", "Origin")
					c.Set("Access-Control-Allow-Credentials", "true")
					c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Tenant-ID, X-Store-ID")
					c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
					if c.Method() == fiber.MethodOptions { return c.SendStatus(fiber.StatusNoContent) }
				}
			}
		}
		return c.Next()
	})
	// Serve uploaded files publicly so frontend can load images without auth
	app.Static("/uploads", "/tmp/uploads")
	app.Get("/health", func(c *fiber.Ctx) error { return c.SendString("ok") })

	roleRepo := repositories.NewRoleRepository(db)
	userRepo := repositories.NewUserRepository(db)
	supplierRepo := repositories.NewSupplierRepository(db)
	tenantRepo := repositories.NewTenantRepository(db)
	companyRepo := repositories.NewCompanyRepository(db)
	storeRepo := repositories.NewStoreRepository(db)
	categoryRepo := repositories.NewCategoryRepository(db)
	attributeRepo := repositories.NewAttributeRepository(db)
	characteristicRepo := repositories.NewCharacteristicRepository(db)
	brandRepo := repositories.NewBrandRepository(db)
	warehouseRepo := repositories.NewWarehouseRepository(db)
	parameterRepo := repositories.NewParameterRepository(db)
	productRepo := repositories.NewProductRepository(db)
	leadRepo := repositories.NewLeadRepository(db)
	customerRepo := repositories.NewCustomerRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	shopCustomerRepo := repositories.NewShopCustomerRepository(db)
	shopUnitRepo := repositories.NewShopUnitRepository(db)
	shopVendorRepo := repositories.NewShopVendorRepository(db)
	shopServiceRepo := repositories.NewShopServiceRepository(db)
	shopContactRepo := repositories.NewShopContactRepository(db)
	importHistoryRepo := repositories.NewImportHistoryRepository(db)
	paymentRepo := repositories.NewPaymentRepository(db)
	statsRepo := repositories.NewStatsRepository(db)
	inventoryRepo := repositories.NewInventoryRepository(db)
	writeOffRepo := repositories.NewWriteOffRepository(db)
	repricingRepo := repositories.NewRepricingRepository(db)
	transferRepo := repositories.NewTransferRepository(db)
	priceTagRepo := repositories.NewPriceTagRepository(db)

	roleSvc := services.NewRoleService(roleRepo)
	userSvc := services.NewUserService(userRepo, roleRepo)
	supplierSvc := services.NewSupplierService(supplierRepo)
	authSvc := services.NewAuthService(userRepo, roleRepo)
	tenantSvc := services.NewTenantService(tenantRepo)
	companySvc := services.NewCompanyService(companyRepo)
	storeSvc := services.NewStoreService(storeRepo)
	categorySvc := services.NewCategoryService(categoryRepo)
	attributeSvc := services.NewAttributeService(attributeRepo)
	characteristicSvc := services.NewCharacteristicService(characteristicRepo)
	brandSvc := services.NewBrandService(brandRepo)
	warehouseSvc := services.NewWarehouseService(warehouseRepo)
	parameterSvc := services.NewParameterService(parameterRepo)
	productSvc := services.NewProductService(productRepo, categoryRepo, brandRepo, supplierRepo)
	leadSvc := services.NewLeadService(leadRepo)
	customerSvc := services.NewCustomerService(customerRepo)
	orderSvc := services.NewOrderService(orderRepo, productRepo, supplierRepo, storeRepo)
	// set singleton for cross-handler use (supplier stats)
	services.SetOrderService(orderSvc)

	shopCustomerSvc := services.NewShopCustomerService(shopCustomerRepo, shopContactRepo)
	shopUnitSvc := services.NewShopUnitService(shopUnitRepo)
	shopVendorSvc := services.NewShopVendorService(shopVendorRepo)
	shopServiceSvc := services.NewShopServiceService(shopServiceRepo, shopCustomerRepo, shopUnitRepo)
	shopContactSvc := services.NewShopContactService(shopContactRepo)
	importHistorySvc := services.NewImportHistoryService(importHistoryRepo)
	paymentSvc := services.NewPaymentService(paymentRepo)
	statsSvc := services.NewStatsService(statsRepo)
	inventorySvc := services.NewInventoryService(inventoryRepo, storeRepo, productRepo)
	writeOffSvc := services.NewWriteOffService(writeOffRepo, storeRepo, productRepo)
	repricingSvc := services.NewRepricingService(repricingRepo, storeRepo, productRepo)
	transferSvc := services.NewTransferService(transferRepo, storeRepo, productRepo)
	priceTagSvc := services.NewPriceTagService(priceTagRepo)

	roleHandler := handlers.NewRoleHandler(roleSvc)
	userHandler := handlers.NewUserHandler(userSvc)
	supplierHandler := handlers.NewSupplierHandler(supplierSvc)
	authHandler := handlers.NewAuthHandler(authSvc)
	leadHandler := handlers.NewLeadHandler(leadSvc)
	tenantHandler := handlers.NewTenantHandler(tenantSvc)
	companyHandler := handlers.NewCompanyHandler(companySvc)
	storeHandler := handlers.NewStoreHandler(storeSvc)
	categoryHandler := handlers.NewCategoryHandler(categorySvc)
	attributeHandler := handlers.NewAttributeHandler(attributeSvc)
	characteristicHandler := handlers.NewCharacteristicHandler(characteristicSvc)
	brandHandler := handlers.NewBrandHandler(brandSvc)
	warehouseHandler := handlers.NewWarehouseHandler(warehouseSvc)
	parameterHandler := handlers.NewParameterHandler(parameterSvc)
	productHandler := handlers.NewProductHandler(productSvc)
	uploadHandler := handlers.NewUploadHandler()
	customerHandler := handlers.NewCustomerHandler(customerSvc)
	orderHandler := handlers.NewOrderHandler(orderSvc)
	shopCustomerHandler := handlers.NewShopCustomerHandler(shopCustomerSvc)
	shopUnitHandler := handlers.NewShopUnitHandler(shopUnitSvc)
	shopVendorHandler := handlers.NewShopVendorHandler(shopVendorSvc)
	shopServiceHandler := handlers.NewShopServiceHandler(shopServiceSvc)
	shopContactHandler := handlers.NewShopContactHandler(shopContactSvc)
	importHistoryHandler := handlers.NewImportHistoryHandler(importHistorySvc)
	billingHandler := handlers.NewBillingHandler(paymentSvc)
	statsHandler := handlers.NewStatsHandler(statsSvc)
	inventoryHandler := handlers.NewInventoryHandler(inventorySvc)
	writeOffHandler := handlers.NewWriteOffHandler(writeOffSvc)
	repricingHandler := handlers.NewRepricingHandler(repricingSvc)
	transferHandler := handlers.NewTransferHandler(transferSvc)
	priceTagHandler := handlers.NewPriceTagHandler(priceTagSvc)

	_ = middleware.NewAuthz(userRepo, roleRepo)
	tenantResolver := middleware.NewTenantResolver(tenantRepo)

	// Superadmin global endpoints (no tenant middleware required)
	routes.Register(app, roleHandler, userHandler, authHandler, supplierHandler, tenantHandler, billingHandler)
	// global stats
	statsHandler.Register(app.Group("/api"))
	// Tenant-scoped endpoints
	routes.RegisterWithTenant(app, roleHandler, userHandler, authHandler, supplierHandler, tenantHandler, tenantResolver, companyHandler, storeHandler, categoryHandler, attributeHandler, characteristicHandler, brandHandler, warehouseHandler, parameterHandler, productHandler, uploadHandler, leadHandler, customerHandler, orderHandler, shopCustomerHandler, shopUnitHandler, shopVendorHandler, shopServiceHandler, shopContactHandler, importHistoryHandler, inventoryHandler, writeOffHandler, repricingHandler, transferHandler, priceTagHandler)

	addr := ":" + cfg.Port
	logger.Info("starting http server", zap.String("addr", addr), zap.String("env", cfg.Env))
	if err := app.Listen(addr); err != nil { log.Fatal(err) }
} 