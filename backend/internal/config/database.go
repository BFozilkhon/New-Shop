package config

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func NewMongoClient(ctx context.Context, uri string) (*mongo.Client, error) {
	opts := options.Client().ApplyURI(uri).SetMaxPoolSize(50).SetMinPoolSize(5).SetConnectTimeout(10 * time.Second).SetServerSelectionTimeout(10 * time.Second)
	client, err := mongo.Connect(ctx, opts)
	if err != nil { return nil, err }
	return client, client.Ping(ctx, nil)
}

func EnsureIndexes(ctx context.Context, db *mongo.Database) error {
	roles := db.Collection("roles")
	_, err := roles.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "key", Value: 1}}, Options: options.Index().SetUnique(true).SetName("ux_roles_key").SetPartialFilterExpression(bson.M{"is_deleted": false}) },
		{ Keys: bson.D{{Key: "is_active", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_roles_active_createdat") },
	})
	if err != nil { return err }
	users := db.Collection("users")
	_, err = users.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true).SetName("ux_users_email").SetPartialFilterExpression(bson.M{"is_deleted": false}) },
		{ Keys: bson.D{{Key: "is_active", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_users_active_createdat") },
	})
	if err != nil { return err }
	suppliers := db.Collection("suppliers")
	_, err = suppliers.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "name", Value: 1}}, Options: options.Index().SetName("ix_suppliers_name") },
		{ Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetName("ix_suppliers_email") },
		{ Keys: bson.D{{Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_suppliers_createdat") },
	})
	if err != nil { return err }
	tenants := db.Collection("tenants")
	_, err = tenants.Indexes().CreateOne(ctx, mongo.IndexModel{ Keys: bson.D{{Key: "subdomain", Value: 1}}, Options: options.Index().SetUnique(true).SetName("ux_tenants_subdomain") })
	if err != nil { return err }
	companies := db.Collection("companies")
	_, err = companies.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_companies_tenant_createdat") },
	})
	if err != nil { return err }
	stores := db.Collection("stores")
	_, err = stores.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "company_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_stores_tenant_company_createdat") },
	})
	if err != nil { return err }
	categories := db.Collection("categories")
	_, err = categories.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "name", Value: 1}}, Options: options.Index().SetName("ix_categories_name") },
		{ Keys: bson.D{{Key: "parent_id", Value: 1}, {Key: "level", Value: 1}}, Options: options.Index().SetName("ix_categories_parent_level") },
		{ Keys: bson.D{{Key: "is_active", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_categories_active_createdat") },
		{ Keys: bson.D{{Key: "is_deleted", Value: 1}}, Options: options.Index().SetName("ix_categories_deleted") },
	})
	if err != nil { return err }
	attributes := db.Collection("attributes")
	_, err = attributes.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "name", Value: 1}}, Options: options.Index().SetName("ix_attributes_name") },
		{ Keys: bson.D{{Key: "value", Value: 1}}, Options: options.Index().SetName("ix_attributes_value") },
		{ Keys: bson.D{{Key: "is_active", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_attributes_active_createdat") },
		{ Keys: bson.D{{Key: "is_deleted", Value: 1}}, Options: options.Index().SetName("ix_attributes_deleted") },
	})
	if err != nil { return err }
	characteristics := db.Collection("characteristics")
	_, err = characteristics.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "name", Value: 1}}, Options: options.Index().SetName("ix_characteristics_name") },
		{ Keys: bson.D{{Key: "type", Value: 1}}, Options: options.Index().SetName("ix_characteristics_type") },
		{ Keys: bson.D{{Key: "is_active", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_characteristics_active_createdat") },
		{ Keys: bson.D{{Key: "is_deleted", Value: 1}}, Options: options.Index().SetName("ix_characteristics_deleted") },
	})
	if err != nil { return err }
	
	brands := db.Collection("brands")
	_, err = brands.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "name", Value: 1}}, Options: options.Index().SetName("ix_brands_tenant_name") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "is_active", Value: 1}}, Options: options.Index().SetName("ix_brands_tenant_active") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_brands_tenant_createdat") },
	})
	if err != nil { return err }
	
	warehouses := db.Collection("warehouses")
	_, err = warehouses.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "name", Value: 1}}, Options: options.Index().SetName("ix_warehouses_tenant_name") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "type", Value: 1}}, Options: options.Index().SetName("ix_warehouses_tenant_type") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "is_active", Value: 1}}, Options: options.Index().SetName("ix_warehouses_tenant_active") },
	})
	if err != nil { return err }
	
	parameters := db.Collection("parameters")
	_, err = parameters.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "name", Value: 1}}, Options: options.Index().SetName("ix_parameters_tenant_name") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "type", Value: 1}}, Options: options.Index().SetName("ix_parameters_tenant_type") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("ix_parameters_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "category", Value: 1}}, Options: options.Index().SetName("ix_parameters_tenant_category") },
	})
	if err != nil { return err }
	
	products := db.Collection("products")
	_, err = products.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "sku", Value: 1}}, Options: options.Index().SetUnique(true).SetName("ux_products_tenant_sku") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "name", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_name") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "category_id", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_category") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "category_ids", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_category_ids") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "brand_id", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_brand") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "supplier_id", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_supplier") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "is_active", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_active") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "is_bundle", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_bundle") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "price", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_price") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "barcode", Value: 1}}, Options: options.Index().SetName("ix_products_tenant_barcode") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_products_tenant_createdat") },
	})
	if err != nil { return err }

	customers := db.Collection("customers")
	_, err = customers.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "phone_number", Value: 1}}, Options: options.Index().SetName("ix_customers_tenant_phone") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "email", Value: 1}}, Options: options.Index().SetName("ix_customers_tenant_email") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_customers_tenant_createdat") },
	})
	if err != nil { return err }

	orders := db.Collection("orders")
	_, err = orders.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_orders_tenant_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status_id", Value: 1}}, Options: options.Index().SetName("ix_orders_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "supplier_id", Value: 1}}, Options: options.Index().SetName("ix_orders_tenant_supplier") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "shop_id", Value: 1}}, Options: options.Index().SetName("ix_orders_tenant_shop") },
	})
	if err != nil { return err }

	// inventories
	inventories := db.Collection("inventories")
	_, err = inventories.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_inventories_tenant_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status_id", Value: 1}}, Options: options.Index().SetName("ix_inventories_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "shop_id", Value: 1}}, Options: options.Index().SetName("ix_inventories_tenant_shop") },
	})
	if err != nil { return err }

	// writeoffs
	writeoffs := db.Collection("writeoffs")
	_, err = writeoffs.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_writeoffs_tenant_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("ix_writeoffs_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "shop_id", Value: 1}}, Options: options.Index().SetName("ix_writeoffs_tenant_shop") },
	})
	if err != nil { return err }

	// repricings
	repricings := db.Collection("repricings")
	_, err = repricings.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_repricing_tenant_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("ix_repricing_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "shop_id", Value: 1}}, Options: options.Index().SetName("ix_repricing_tenant_shop") },
	})
	if err != nil { return err }

	// transfers
	transfers := db.Collection("transfers")
	_, err = transfers.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_transfers_tenant_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("ix_transfers_tenant_status") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "departure_shop_id", Value: 1}}, Options: options.Index().SetName("ix_transfers_tenant_departure") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "arrival_shop_id", Value: 1}}, Options: options.Index().SetName("ix_transfers_tenant_arrival") },
	})
	if err != nil { return err }

	// price tag templates
	pt := db.Collection("price_tag_templates")
	_, err = pt.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "name", Value: 1}}, Options: options.Index().SetName("ix_pricetags_tenant_name") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_pricetags_tenant_createdat") },
	})
	if err != nil { return err }

	// shop_customers
	shopCustomers := db.Collection("shop_customers")
	_, err = shopCustomers.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "company_name", Value: 1}}, Options: options.Index().SetName("ix_shopcustomers_tenant_company") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "phone", Value: 1}}, Options: options.Index().SetName("ix_shopcustomers_tenant_phone") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "email", Value: 1}}, Options: options.Index().SetName("ix_shopcustomers_tenant_email") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_shopcustomers_tenant_createdat") },
	})
	if err != nil { return err }

	// shop_contacts
	shopContacts := db.Collection("shop_contacts")
	_, err = shopContacts.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "customer_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_shopcontacts_tenant_customer_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "email", Value: 1}}, Options: options.Index().SetName("ix_shopcontacts_tenant_email") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "phone", Value: 1}}, Options: options.Index().SetName("ix_shopcontacts_tenant_phone") },
	})
	if err != nil { return err }

	// shop_units
	shopUnits := db.Collection("shop_units")
	_, err = shopUnits.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "customer_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_shopunits_tenant_customer_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "vin", Value: 1}}, Options: options.Index().SetName("ix_shopunits_tenant_vin") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "unit_number", Value: 1}}, Options: options.Index().SetName("ix_shopunits_tenant_unitnumber") },
	})
	if err != nil { return err }

	// shop_vendors
	shopVendors := db.Collection("shop_vendors")
	_, err = shopVendors.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "vendor_name", Value: 1}}, Options: options.Index().SetName("ix_shopvendors_tenant_vendor") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "email", Value: 1}}, Options: options.Index().SetName("ix_shopvendors_tenant_email") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "phone", Value: 1}}, Options: options.Index().SetName("ix_shopvendors_tenant_phone") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_shopvendors_tenant_createdat") },
	})
	if err != nil { return err }

	// shop_services
	shopServices := db.Collection("shop_services")
	_, err = shopServices.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "customer_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_shopservices_tenant_customer_createdat") },
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "estimate_number", Value: 1}}, Options: options.Index().SetName("ix_shopservices_tenant_estimate") },
	})
	if err != nil { return err }

	// import_history
	importHistory := db.Collection("import_history")
	_, err = importHistory.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_importhistory_tenant_createdat") },
	})
	if err != nil { return err }

	// payments (global)
	payments := db.Collection("payments")
	_, err = payments.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{ Keys: bson.D{{Key: "tenant_id", Value: 1}, {Key: "created_at", Value: -1}}, Options: options.Index().SetName("ix_payments_tenant_createdat") },
	})
	if err != nil { return err }

	return err
} 