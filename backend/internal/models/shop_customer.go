package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ShopLaborRate represents a selectable labor rate option key and price
// The list itself is returned from a read-only endpoint; values are stored by key on the customer

type ShopCustomer struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID    string             `bson:"tenant_id" json:"tenant_id"`
	CompanyName string             `bson:"company_name" json:"company_name"`
	FirstName   string             `bson:"first_name" json:"first_name"`
	LastName    string             `bson:"last_name,omitempty" json:"last_name,omitempty"`
	Phone       string             `bson:"phone,omitempty" json:"phone,omitempty"`
	CellPhone   string             `bson:"cell_phone,omitempty" json:"cell_phone,omitempty"`
	Email       string             `bson:"email,omitempty" json:"email,omitempty"`
	DOTNumber   string             `bson:"dot_number,omitempty" json:"dot_number,omitempty"`
	LaborRate   string             `bson:"labor_rate" json:"labor_rate"` // stores the key of labor rate
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type ShopCustomerDTO struct {
	ID          string    `json:"id"`
	TenantID    string    `json:"tenant_id"`
	CompanyName string    `json:"company_name"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name,omitempty"`
	Phone       string    `json:"phone,omitempty"`
	CellPhone   string    `json:"cell_phone,omitempty"`
	Email       string    `json:"email,omitempty"`
	DOTNumber   string    `json:"dot_number,omitempty"`
	LaborRate   string    `json:"labor_rate"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func ToShopCustomerDTO(m ShopCustomer) ShopCustomerDTO {
	return ShopCustomerDTO{
		ID: m.ID.Hex(), TenantID: m.TenantID, CompanyName: m.CompanyName, FirstName: m.FirstName, LastName: m.LastName,
		Phone: m.Phone, CellPhone: m.CellPhone, Email: m.Email, DOTNumber: m.DOTNumber, LaborRate: m.LaborRate, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

type ShopCustomerCreate struct {
	CompanyName string `json:"company_name"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Phone       string `json:"phone"`
	CellPhone   string `json:"cell_phone"`
	Email       string `json:"email"`
	DOTNumber   string `json:"dot_number"`
	LaborRate   string `json:"labor_rate"`
}

type ShopCustomerUpdate struct {
	CompanyName *string `json:"company_name"`
	FirstName   *string `json:"first_name"`
	LastName    *string `json:"last_name"`
	Phone       *string `json:"phone"`
	CellPhone   *string `json:"cell_phone"`
	Email       *string `json:"email"`
	DOTNumber   *string `json:"dot_number"`
	LaborRate   *string `json:"labor_rate"`
} 