package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CompanyRequisites struct {
	LegalName   string `bson:"legal_name" json:"legal_name"`
	LegalAddress string `bson:"legal_address" json:"legal_address"`
	Country     string `bson:"country" json:"country"`
	ZipCode     string `bson:"zip_code" json:"zip_code"`
	BankAccount string `bson:"bank_account" json:"bank_account"`
	BankName    string `bson:"bank_name" json:"bank_name"`
	TIN         string `bson:"tin" json:"tin"`
	IBT         string `bson:"ibt" json:"ibt"`
}

type Company struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  primitive.ObjectID `bson:"tenant_id" json:"tenant_id"`
	Title     string             `bson:"title" json:"title"`
	Email     string             `bson:"email" json:"email"`
	Requisites CompanyRequisites `bson:"requisites" json:"requisites"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CompanyDTO struct {
	ID        string             `json:"id"`
	TenantID  string             `json:"tenant_id"`
	Title     string             `json:"title"`
	Email     string             `json:"email"`
	Requisites CompanyRequisites `json:"requisites"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
}

func ToCompanyDTO(m Company) CompanyDTO {
	return CompanyDTO{ ID: m.ID.Hex(), TenantID: m.TenantID.Hex(), Title: m.Title, Email: m.Email, Requisites: m.Requisites, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt }
}

type CompanyCreate struct {
	Title     string             `json:"title"`
	Email     string             `json:"email"`
	Requisites CompanyRequisites `json:"requisites"`
}

type CompanyUpdate struct {
	Title     *string            `json:"title"`
	Email     *string            `json:"email"`
	Requisites *CompanyRequisites `json:"requisites"`
}

type DaySchedule struct {
	Enabled bool   `bson:"enabled" json:"enabled"`
	Open    string `bson:"open" json:"open"`
	Close   string `bson:"close" json:"close"`
}

type WeekSchedule struct {
	Mon DaySchedule `bson:"mon" json:"mon"`
	Tue DaySchedule `bson:"tue" json:"tue"`
	Wed DaySchedule `bson:"wed" json:"wed"`
	Thu DaySchedule `bson:"thu" json:"thu"`
	Fri DaySchedule `bson:"fri" json:"fri"`
	Sat DaySchedule `bson:"sat" json:"sat"`
	Sun DaySchedule `bson:"sun" json:"sun"`
}

type StoreContacts struct {
	Phone     string `bson:"phone" json:"phone"`
	Facebook  string `bson:"facebook" json:"facebook"`
	Instagram string `bson:"instagram" json:"instagram"`
	Telegram  string `bson:"telegram" json:"telegram"`
	Website   string `bson:"website" json:"website"`
}

type Store struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  primitive.ObjectID `bson:"tenant_id" json:"tenant_id"`
	CompanyID primitive.ObjectID `bson:"company_id" json:"company_id"`
	Title     string             `bson:"title" json:"title"`
	Square    float64            `bson:"square" json:"square"`
	TIN       string             `bson:"tin" json:"tin"`
	Working   WeekSchedule       `bson:"working" json:"working"`
	Contacts  StoreContacts      `bson:"contacts" json:"contacts"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type StoreDTO struct {
	ID        string        `json:"id"`
	TenantID  string        `json:"tenant_id"`
	CompanyID string        `json:"company_id"`
	Title     string        `json:"title"`
	Square    float64       `json:"square"`
	TIN       string        `json:"tin"`
	Working   WeekSchedule  `json:"working"`
	Contacts  StoreContacts `json:"contacts"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func ToStoreDTO(m Store) StoreDTO {
	return StoreDTO{ ID: m.ID.Hex(), TenantID: m.TenantID.Hex(), CompanyID: m.CompanyID.Hex(), Title: m.Title, Square: m.Square, TIN: m.TIN, Working: m.Working, Contacts: m.Contacts, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt }
}

type StoreCreate struct {
	CompanyID string        `json:"company_id"`
	Title     string        `json:"title"`
	Square    float64       `json:"square"`
	TIN       string        `json:"tin"`
	Working   WeekSchedule  `json:"working"`
	Contacts  StoreContacts `json:"contacts"`
}

type StoreUpdate struct {
	CompanyID *string        `json:"company_id"`
	Title     *string        `json:"title"`
	Square    *float64       `json:"square"`
	TIN       *string        `json:"tin"`
	Working   *WeekSchedule  `json:"working"`
	Contacts  *StoreContacts `json:"contacts"`
} 