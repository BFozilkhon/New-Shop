package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// removed inline contact fields; using reference to contact

type ShopServicePart struct {
	Name       string  `bson:"name" json:"name"`
	PartNumber string  `bson:"part_number" json:"part_number"`
	Quantity   int     `bson:"quantity" json:"quantity"`
	Cost       float64 `bson:"cost" json:"cost"`
	Price      float64 `bson:"price" json:"price"`
}

type ShopServiceItem struct {
	Title      string             `bson:"title" json:"title"`
	LaborHours float64            `bson:"labor_hours" json:"labor_hours"`
	LaborRate  float64            `bson:"labor_rate" json:"labor_rate"`
	LaborCost  float64            `bson:"labor_cost" json:"labor_cost"`
	LaborPrice float64            `bson:"labor_price" json:"labor_price"`
	Parts      []ShopServicePart  `bson:"parts" json:"parts"`
}

type ShopServiceMisc struct {
	Name   string  `bson:"name" json:"name"`
	Amount float64 `bson:"amount" json:"amount"`
}

type ShopService struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID           string             `bson:"tenant_id" json:"tenant_id"`
	CustomerID         string             `bson:"customer_id" json:"customer_id"`
	ContactID          string             `bson:"contact_id" json:"contact_id"`
	UnitID             string             `bson:"unit_id" json:"unit_id"`
	ChassisMiles       int                `bson:"chassis_miles" json:"chassis_miles"`
	CustomerComplaint  string             `bson:"customer_complaint" json:"customer_complaint"`
	TechnicianID       string             `bson:"technician_id" json:"technician_id"`
	Notes              string             `bson:"notes" json:"notes"`
	EstimateNumber     string             `bson:"estimate_number" json:"estimate_number"`
	AuthorizationNumber string            `bson:"authorization_number" json:"authorization_number"`
	PONumber           string             `bson:"po_number" json:"po_number"`
	Description        string             `bson:"description" json:"description"`

	Items              []ShopServiceItem  `bson:"items" json:"items"`
	ShopSupplies       float64            `bson:"shop_supplies" json:"shop_supplies"`
	LaborTotal         float64            `bson:"labor_total" json:"labor_total"`
	PartsTotal         float64            `bson:"parts_total" json:"parts_total"`
	Extras             []ShopServiceMisc  `bson:"extras" json:"extras"`
	ExtrasTotal        float64            `bson:"extras_total" json:"extras_total"`
	Subtotal           float64            `bson:"subtotal" json:"subtotal"`
	// tax fields
	TaxLocation        string             `bson:"tax_location" json:"tax_location"`
	TaxRate            float64            `bson:"tax_rate" json:"tax_rate"`
	TaxAmount          float64            `bson:"tax_amount" json:"tax_amount"`
	Total              float64            `bson:"total" json:"total"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type ShopServiceDTO struct {
	ID                 string             `json:"id"`
	TenantID           string             `json:"tenant_id"`
	CustomerID         string             `json:"customer_id"`
	ContactID          string             `json:"contact_id"`
	UnitID             string             `json:"unit_id"`
	ChassisMiles       int                `json:"chassis_miles"`
	CustomerComplaint  string             `json:"customer_complaint"`
	TechnicianID       string             `json:"technician_id"`
	Notes              string             `json:"notes"`
	EstimateNumber     string             `json:"estimate_number"`
	AuthorizationNumber string            `json:"authorization_number"`
	PONumber           string             `json:"po_number"`
	Description        string             `json:"description"`
	Items              []ShopServiceItem  `json:"items"`
	ShopSupplies       float64            `json:"shop_supplies"`
	LaborTotal         float64            `json:"labor_total"`
	PartsTotal         float64            `json:"parts_total"`
	Extras             []ShopServiceMisc  `json:"extras"`
	ExtrasTotal        float64            `json:"extras_total"`
	Subtotal           float64            `json:"subtotal"`
	TaxLocation        string             `json:"tax_location"`
	TaxRate            float64            `json:"tax_rate"`
	TaxAmount          float64            `json:"tax_amount"`
	Total              float64            `json:"total"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`

	// Enriched labels for UI
	CustomerName       string             `json:"customer_name,omitempty"`
	UnitLabel          string             `json:"unit_label,omitempty"`
}

func ToShopServiceDTO(m ShopService) ShopServiceDTO {
	return ShopServiceDTO{
		ID: m.ID.Hex(), TenantID: m.TenantID, CustomerID: m.CustomerID, ContactID: m.ContactID, UnitID: m.UnitID,
		ChassisMiles: m.ChassisMiles, CustomerComplaint: m.CustomerComplaint, TechnicianID: m.TechnicianID, Notes: m.Notes,
		EstimateNumber: m.EstimateNumber, AuthorizationNumber: m.AuthorizationNumber, PONumber: m.PONumber, Description: m.Description,
		Items: m.Items, ShopSupplies: m.ShopSupplies, LaborTotal: m.LaborTotal, PartsTotal: m.PartsTotal, Extras: m.Extras, ExtrasTotal: m.ExtrasTotal,
		Subtotal: m.Subtotal, TaxLocation: m.TaxLocation, TaxRate: m.TaxRate, TaxAmount: m.TaxAmount, Total: m.Total, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

// Input payloads

type ShopServiceCreate struct {
	CustomerID         string             `json:"customer_id"`
	ContactID          string             `json:"contact_id"`
	UnitID             string             `json:"unit_id"`
	ChassisMiles       int                `json:"chassis_miles"`
	CustomerComplaint  string             `json:"customer_complaint"`
	TechnicianID       string             `json:"technician_id"`
	Notes              string             `json:"notes"`
	EstimateNumber     string             `json:"estimate_number"`
	AuthorizationNumber string            `json:"authorization_number"`
	PONumber           string             `json:"po_number"`
	Description        string             `json:"description"`
	Items              []ShopServiceItem  `json:"items"`
	ShopSupplies       float64            `json:"shop_supplies"`
	Extras             []ShopServiceMisc  `json:"extras"`
	TaxLocation        string             `json:"tax_location"`
}

type ShopServiceUpdate struct {
	CustomerID         *string
	ContactID          *string
	UnitID             *string
	ChassisMiles       *int
	CustomerComplaint  *string
	TechnicianID       *string
	Notes              *string
	EstimateNumber     *string
	AuthorizationNumber *string
	PONumber           *string
	Description        *string
	Items              *[]ShopServiceItem
	ShopSupplies       *float64
	Extras             *[]ShopServiceMisc
	TaxLocation        *string
} 