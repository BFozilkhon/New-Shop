package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopContact struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`
	CustomerID string            `bson:"customer_id" json:"customer_id"`
	FirstName string             `bson:"first_name" json:"first_name"`
	LastName  string             `bson:"last_name,omitempty" json:"last_name,omitempty"`
	Email     string             `bson:"email,omitempty" json:"email,omitempty"`
	Phone     string             `bson:"phone,omitempty" json:"phone,omitempty"`
	CellPhone string             `bson:"cell_phone,omitempty" json:"cell_phone,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type ShopContactDTO struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	CustomerID string   `json:"customer_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name,omitempty"`
	Email     string    `json:"email,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	CellPhone string    `json:"cell_phone,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToShopContactDTO(m ShopContact) ShopContactDTO {
	return ShopContactDTO{ ID: m.ID.Hex(), TenantID: m.TenantID, CustomerID: m.CustomerID, FirstName: m.FirstName, LastName: m.LastName, Email: m.Email, Phone: m.Phone, CellPhone: m.CellPhone, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt }
}

type ShopContactCreate struct {
	CustomerID string `json:"customer_id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	CellPhone  string `json:"cell_phone"`
}

type ShopContactUpdate struct {
	FirstName  *string `json:"first_name"`
	LastName   *string `json:"last_name"`
	Email      *string `json:"email"`
	Phone      *string `json:"phone"`
	CellPhone  *string `json:"cell_phone"`
} 