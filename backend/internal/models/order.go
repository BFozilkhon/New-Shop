package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Order main model
// Mirrors the provided schema while aligning JSON usage with string ids for payloads

type Order struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID      string             `bson:"tenant_id" json:"tenant_id"`
	ExternalID    int64              `bson:"external_id" json:"external_id"`
	Name          string             `bson:"name" json:"name"`
	InvoiceNumber int64              `bson:"invoice_number" json:"invoice_number"`
	Comment       string             `bson:"comment" json:"comment"`
	CompanyID     string             `bson:"company_id" json:"company_id"`
	AllowedShops  string             `bson:"allowed_shops" json:"allowed_shops"`
	Type          string             `bson:"type" json:"type"` // supplier_order, customer_order, return_order

	StatusID              string  `bson:"status_id" json:"status_id"`
	IsFinished            bool    `bson:"is_finished" json:"is_finished"`
	IsFromFile            bool    `bson:"is_from_file" json:"is_from_file"`
	SaleProgress          float64 `bson:"sale_progress" json:"sale_progress"`
	SettlementType        string  `bson:"settlement_type" json:"settlement_type"`
	RetailPriceChangeType string  `bson:"retail_price_change_type" json:"retail_price_change_type"`

	SupplierID string        `bson:"supplier_id" json:"supplier_id"`
	Supplier   OrderSupplier `bson:"supplier" json:"supplier"`

	ShopID string    `bson:"shop_id" json:"shop_id"`
	Shop   OrderShop `bson:"shop" json:"shop"`

	CreatedBy  OrderUser `bson:"created_by" json:"created_by"`
	AcceptedBy OrderUser `bson:"accepted_by" json:"accepted_by"`

	CreatedAt     time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time `bson:"updated_at" json:"updated_at"`
	AcceptingDate string    `bson:"accepting_date" json:"accepting_date"`
	PaymentDate   string    `bson:"payment_date" json:"payment_date"`
	DeletedAt     int64     `bson:"deleted_at" json:"deleted_at"`

	TotalPrice           float64 `bson:"total_price" json:"total_price"`
	TotalSupplyPrice     float64 `bson:"total_supply_price" json:"total_supply_price"`
	TotalRetailPrice     float64 `bson:"total_retail_price" json:"total_retail_price"`
	TotalPaidAmount      float64 `bson:"total_paid_amount" json:"total_paid_amount"`
	TotalAmountDebit     float64 `bson:"total_amount_debit" json:"total_amount_debit"`
	TotalReturnedAmount  float64 `bson:"total_returned_amount" json:"total_returned_amount"`
	ProcessedSupplyPrice float64 `bson:"processed_supply_price" json:"processed_supply_price"`
	ToReturnAmount       float64 `bson:"to_return_amount" json:"to_return_amount"`
	ReturnedPayments     float64 `bson:"returned_payments" json:"returned_payments"`

	ItemsCount                    int     `bson:"items_count" json:"items_count"`
	LeftMeasurementValue          float64 `bson:"left_measurement_value" json:"left_measurement_value"`
	TotalMeasurementValue         float64 `bson:"total_measurement_value" json:"total_measurement_value"`
	TotalAcceptedMeasurementValue float64 `bson:"total_accepted_measurement_value" json:"total_accepted_measurement_value"`
	ReturnedMeasurementValue      float64 `bson:"returned_measurement_value" json:"returned_measurement_value"`
	TotalMeasurementValueToReturn float64 `bson:"total_measurement_value_to_return" json:"total_measurement_value_to_return"`

	ReturnedSupplierOrderID   string `bson:"returned_supplier_order_id" json:"returned_supplier_order_id"`
	ReturnedSupplierOrderName string `bson:"returned_supplier_order_name" json:"returned_supplier_order_name"`

	Payments []OrderPayment `bson:"payments" json:"payments"`
	Items    []OrderItem    `bson:"items" json:"items"`
}

type OrderSupplier struct {
	ID           string   `bson:"id" json:"id"`
	Name         string   `bson:"name" json:"name"`
	PhoneNumbers []string `bson:"phone_numbers" json:"phone_numbers"`
	ExternalID   int64    `bson:"external_id" json:"external_id"`
	DebtValue    float64  `bson:"debt_value" json:"debt_value"`
	Balance      float64  `bson:"balance" json:"balance"`
}

type OrderShop struct {
	ID   string `bson:"id" json:"id"`
	Name string `bson:"name" json:"name"`
}

type OrderUser struct {
	ID   string `bson:"id" json:"id"`
	Name string `bson:"name" json:"name"`
}

type OrderPayment struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Amount        float64            `bson:"amount" json:"amount"`
	PaymentDate   time.Time          `bson:"payment_date" json:"payment_date"`
	PaymentMethod string             `bson:"payment_method" json:"payment_method"`
	Description   string             `bson:"description" json:"description"`
	Status        string             `bson:"status" json:"status"`
}

type AddOrderPaymentRequest struct {
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"`
	Description   string    `json:"description"`
	AccountID     string    `json:"account_id"`
	PaymentDate   time.Time `json:"payment_date"`
}

type OrderItem struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID        primitive.ObjectID `bson:"product_id" json:"product_id"`
	ProductName      string             `bson:"product_name" json:"product_name"`
	ProductSKU       string             `bson:"product_sku" json:"product_sku"`
	Quantity         int                `bson:"quantity" json:"quantity"`
	UnitPrice        float64            `bson:"unit_price" json:"unit_price"`
	TotalPrice       float64            `bson:"total_price" json:"total_price"`
	SupplyPrice      float64            `bson:"supply_price" json:"supply_price"`
	RetailPrice      float64            `bson:"retail_price" json:"retail_price"`
	AcceptedQuantity int                `bson:"accepted_quantity" json:"accepted_quantity"`
	ReturnedQuantity int                `bson:"returned_quantity" json:"returned_quantity"`
	MeasurementValue float64            `bson:"measurement_value" json:"measurement_value"`
	Unit             string             `bson:"unit" json:"unit"`
}

// Payload-friendly input for items (string ids)
// Used in Create/Update requests to allow JSON string ids and then converted in service

type OrderItemInput struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	ProductSKU  string  `json:"product_sku"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	SupplyPrice float64 `json:"supply_price"`
	RetailPrice float64 `json:"retail_price"`
	Unit        string  `json:"unit"`
}

type OrderStatus struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Code        string             `bson:"code" json:"code"`
	Color       string             `bson:"color" json:"color"`
	Description string             `bson:"description" json:"description"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	SortOrder   int                `bson:"sort_order" json:"sort_order"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type OrderListResponse struct {
	Orders     []Order `json:"orders"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}

type OrderStatistics struct {
	TotalOrders         int64   `json:"total_orders"`
	UnpaidOrders        int64   `json:"unpaid_orders"`
	PartiallyPaidOrders int64   `json:"partially_paid_orders"`
	PaidOrders          int64   `json:"paid_orders"`
	TotalAmount         float64 `json:"total_amount"`
	TotalPaidAmount     float64 `json:"total_paid_amount"`
	TotalUnpaidAmount   float64 `json:"total_unpaid_amount"`
}

type CreateOrderRequest struct {
	Name             string           `json:"name"`
	SupplierID       string           `json:"supplier_id"`
	ShopID           string           `json:"shop_id"`
	Comment          string           `json:"comment"`
	Type             string           `json:"type"`
	Items            []OrderItemInput `json:"items"`
	PaymentDate      string           `json:"payment_date"`
	SettlementType   string           `json:"settlement_type"`
	TotalPrice       float64          `json:"total_price"`
	TotalSupplyPrice float64          `json:"total_supply_price"`
	TotalRetailPrice float64          `json:"total_retail_price"`
}

type UpdateOrderRequest struct {
	Name             string           `json:"name"`
	Comment          string           `json:"comment"`
	StatusID         string           `json:"status_id"`
	Items            []OrderItemInput `json:"items"`
	PaymentDate      string           `json:"payment_date"`
	SettlementType   string           `json:"settlement_type"`
	TotalPrice       float64          `json:"total_price"`
	TotalSupplyPrice float64          `json:"total_supply_price"`
	TotalRetailPrice float64          `json:"total_retail_price"`
	TotalPaidAmount  float64          `json:"total_paid_amount"`
	IsFinished       bool             `json:"is_finished"`
	SaleProgress     float64          `json:"sale_progress"`
	Action           string           `json:"action"`
}

type OrderFilterRequest struct {
	Search        string `json:"search"`
	StatusID      string `json:"status_id"`
	SupplierID    string `json:"supplier_id"`
	ShopID        string `json:"shop_id"`
	CreatedBy     string `json:"created_by"`
	DateFrom      string `json:"date_from"`
	DateTo        string `json:"date_to"`
	PaymentStatus string `json:"payment_status"` // all, unpaid, partially_paid, paid
	Type          string `json:"type"`
	Page          int    `json:"page"`
	Limit         int    `json:"limit"`
	SortBy        string `json:"sort_by"`
	SortOrder     string `json:"sort_order"`
} 