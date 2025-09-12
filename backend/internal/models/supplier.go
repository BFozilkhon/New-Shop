package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SupplierAddress struct {
	Country  string `bson:"country" json:"country"`
	City     string `bson:"city" json:"city"`
	District string `bson:"district" json:"district"`
	Street   string `bson:"street" json:"street"`
	House    string `bson:"house" json:"house"`
}

type Supplier struct {
	ID                      primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID                string             `bson:"tenant_id" json:"tenant_id"`
	Name                    string             `bson:"name" json:"name"`
	DefaultMarkupPercentage float64            `bson:"default_markup_percentage" json:"default_markup_percentage"`
	Phone                   string             `bson:"phone" json:"phone"`
	Email                   string             `bson:"email" json:"email"`
	Notes                   string             `bson:"notes" json:"notes"`
	LegalAddress            SupplierAddress    `bson:"legal_address" json:"legal_address"`
	BankAccount             string             `bson:"bank_account" json:"bank_account"`
	BankNameBranch          string             `bson:"bank_name_branch" json:"bank_name_branch"`
	INN                     string             `bson:"inn" json:"inn"`
	MFO                     string             `bson:"mfo" json:"mfo"`
	Documents               []string           `bson:"documents" json:"documents"`
	CreatedAt               time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt               time.Time          `bson:"updated_at" json:"updated_at"`
}

type SupplierDTO struct {
	ID                      string          `json:"id"`
	TenantID                string          `json:"tenant_id"`
	Name                    string          `json:"name"`
	DefaultMarkupPercentage float64         `json:"default_markup_percentage"`
	Phone                   string          `json:"phone"`
	Email                   string          `json:"email"`
	Notes                   string          `json:"notes"`
	LegalAddress            SupplierAddress `json:"legal_address"`
	BankAccount             string          `json:"bank_account"`
	BankNameBranch          string          `json:"bank_name_branch"`
	INN                     string          `json:"inn"`
	MFO                     string          `json:"mfo"`
	Documents               []string        `json:"documents"`
	CreatedAt               time.Time       `json:"created_at"`
	UpdatedAt               time.Time       `json:"updated_at"`
}

func ToSupplierDTO(m Supplier) SupplierDTO {
	return SupplierDTO{
		ID: m.ID.Hex(), TenantID: m.TenantID, Name: m.Name, DefaultMarkupPercentage: m.DefaultMarkupPercentage,
		Phone: m.Phone, Email: m.Email, Notes: m.Notes, LegalAddress: m.LegalAddress, BankAccount: m.BankAccount,
		BankNameBranch: m.BankNameBranch, INN: m.INN, MFO: m.MFO, Documents: m.Documents, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

type SupplierCreate struct {
	TenantID                string          `json:"tenant_id"`
	Name                    string          `json:"name"`
	DefaultMarkupPercentage float64         `json:"default_markup_percentage"`
	Phone                   string          `json:"phone"`
	Email                   string          `json:"email"`
	Notes                   string          `json:"notes"`
	LegalAddress            SupplierAddress `json:"legal_address"`
	BankAccount             string          `json:"bank_account"`
	BankNameBranch          string          `json:"bank_name_branch"`
	INN                     string          `json:"inn"`
	MFO                     string          `json:"mfo"`
	Documents               []string        `json:"documents"`
}

type SupplierUpdate struct {
	TenantID                *string          `json:"tenant_id"`
	Name                    *string          `json:"name"`
	DefaultMarkupPercentage *float64         `json:"default_markup_percentage"`
	Phone                   *string          `json:"phone"`
	Email                   *string          `json:"email"`
	Notes                   *string          `json:"notes"`
	LegalAddress            *SupplierAddress `json:"legal_address"`
	BankAccount             *string          `json:"bank_account"`
	BankNameBranch          *string          `json:"bank_name_branch"`
	INN                     *string          `json:"inn"`
	MFO                     *string          `json:"mfo"`
	Documents               *[]string        `json:"documents"`
} 