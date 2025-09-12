package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Address for customer
type CustomerAddress struct {
	Country    string `bson:"country" json:"country"`
	City       string `bson:"city" json:"city"`
	Address    string `bson:"address" json:"address"`
	PostIndex  string `bson:"post_index" json:"post_index"`
	Note       string `bson:"note" json:"note"`
}

// Customer entity
type Customer struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID        string             `bson:"tenant_id" json:"tenant_id"`
	FirstName       string             `bson:"first_name" json:"first_name"`
	LastName        string             `bson:"last_name,omitempty" json:"last_name,omitempty"`
	MiddleName      string             `bson:"middle_name,omitempty" json:"middle_name,omitempty"`
	DateOfBirth     *time.Time         `bson:"date_of_birth,omitempty" json:"date_of_birth,omitempty"`
	Gender          string             `bson:"gender,omitempty" json:"gender,omitempty"` // male|female
	PhoneNumber     string             `bson:"phone_number" json:"phone_number"`
	PrimaryLanguage string             `bson:"primary_language" json:"primary_language"` // UZ|RU|EN
	Address         CustomerAddress    `bson:"address" json:"address"`
	Email           string             `bson:"email,omitempty" json:"email,omitempty"`
	Telegram        string             `bson:"telegram,omitempty" json:"telegram,omitempty"`
	Facebook        string             `bson:"facebook,omitempty" json:"facebook,omitempty"`
	Instagram       string             `bson:"instagram,omitempty" json:"instagram,omitempty"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

// DTO
type CustomerDTO struct {
	ID              string           `json:"id"`
	TenantID        string           `json:"tenant_id"`
	FirstName       string           `json:"first_name"`
	LastName        string           `json:"last_name,omitempty"`
	MiddleName      string           `json:"middle_name,omitempty"`
	DateOfBirth     *time.Time       `json:"date_of_birth,omitempty"`
	Gender          string           `json:"gender,omitempty"`
	PhoneNumber     string           `json:"phone_number"`
	PrimaryLanguage string           `json:"primary_language"`
	Address         CustomerAddress  `json:"address"`
	Email           string           `json:"email,omitempty"`
	Telegram        string           `json:"telegram,omitempty"`
	Facebook        string           `json:"facebook,omitempty"`
	Instagram       string           `json:"instagram,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

func ToCustomerDTO(m Customer) CustomerDTO {
	return CustomerDTO{
		ID: m.ID.Hex(), TenantID: m.TenantID, FirstName: m.FirstName, LastName: m.LastName, MiddleName: m.MiddleName,
		DateOfBirth: m.DateOfBirth, Gender: m.Gender, PhoneNumber: m.PhoneNumber, PrimaryLanguage: m.PrimaryLanguage,
		Address: m.Address, Email: m.Email, Telegram: m.Telegram, Facebook: m.Facebook, Instagram: m.Instagram,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

// Payloads

type CustomerCreate struct {
	FirstName       string          `json:"first_name"`
	LastName        string          `json:"last_name,omitempty"`
	MiddleName      string          `json:"middle_name,omitempty"`
	DateOfBirth     *time.Time      `json:"date_of_birth,omitempty"`
	Gender          string          `json:"gender,omitempty"`
	PhoneNumber     string          `json:"phone_number"`
	PrimaryLanguage string          `json:"primary_language,omitempty"`
	Address         CustomerAddress `json:"address"`
	Email           string          `json:"email,omitempty"`
	Telegram        string          `json:"telegram,omitempty"`
	Facebook        string          `json:"facebook,omitempty"`
	Instagram       string          `json:"instagram,omitempty"`
}

type CustomerUpdate struct {
	FirstName       *string          `json:"first_name"`
	LastName        *string          `json:"last_name"`
	MiddleName      *string          `json:"middle_name"`
	DateOfBirth     *time.Time       `json:"date_of_birth"`
	Gender          *string          `json:"gender"`
	PhoneNumber     *string          `json:"phone_number"`
	PrimaryLanguage *string          `json:"primary_language"`
	Address         *CustomerAddress `json:"address"`
	Email           *string          `json:"email"`
	Telegram        *string          `json:"telegram"`
	Facebook        *string          `json:"facebook"`
	Instagram       *string          `json:"instagram"`
} 