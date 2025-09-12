package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShopUnit struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID           string             `bson:"tenant_id" json:"tenant_id"`
	CustomerID         string             `bson:"customer_id" json:"customer_id"`
	Type               string             `bson:"type" json:"type"`
	VIN                string             `bson:"vin" json:"vin"`
	Year               string             `bson:"year" json:"year"`
	Make               string             `bson:"make" json:"make"`
	Model              string             `bson:"model" json:"model"`
	UnitNumber         string             `bson:"unit_number" json:"unit_number"`
	UnitNickname       string             `bson:"unit_nickname" json:"unit_nickname"`
	Fleet              string             `bson:"fleet" json:"fleet"`
	LicensePlateState  string             `bson:"license_plate_state" json:"license_plate_state"`
	LicensePlate       string             `bson:"license_plate" json:"license_plate"`
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at" json:"updated_at"`
}

type ShopUnitDTO struct {
	ID                 string    `json:"id"`
	TenantID           string    `json:"tenant_id"`
	CustomerID         string    `json:"customer_id"`
	Type               string    `json:"type"`
	VIN                string    `json:"vin"`
	Year               string    `json:"year"`
	Make               string    `json:"make"`
	Model              string    `json:"model"`
	UnitNumber         string    `json:"unit_number"`
	UnitNickname       string    `json:"unit_nickname"`
	Fleet              string    `json:"fleet"`
	LicensePlateState  string    `json:"license_plate_state"`
	LicensePlate       string    `json:"license_plate"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func ToShopUnitDTO(m ShopUnit) ShopUnitDTO {
	return ShopUnitDTO{
		ID: m.ID.Hex(), TenantID: m.TenantID, CustomerID: m.CustomerID, Type: m.Type, VIN: m.VIN, Year: m.Year,
		Make: m.Make, Model: m.Model, UnitNumber: m.UnitNumber, UnitNickname: m.UnitNickname, Fleet: m.Fleet,
		LicensePlateState: m.LicensePlateState, LicensePlate: m.LicensePlate, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

type ShopUnitCreate struct {
	CustomerID         string `json:"customer_id"`
	Type               string `json:"type"`
	VIN                string `json:"vin"`
	Year               string `json:"year"`
	Make               string `json:"make"`
	Model              string `json:"model"`
	UnitNumber         string `json:"unit_number"`
	UnitNickname       string `json:"unit_nickname"`
	Fleet              string `json:"fleet"`
	LicensePlateState  string `json:"license_plate_state"`
	LicensePlate       string `json:"license_plate"`
}

type ShopUnitUpdate struct {
	Type               *string `json:"type"`
	VIN                *string `json:"vin"`
	Year               *string `json:"year"`
	Make               *string `json:"make"`
	Model              *string `json:"model"`
	UnitNumber         *string `json:"unit_number"`
	UnitNickname       *string `json:"unit_nickname"`
	Fleet              *string `json:"fleet"`
	LicensePlateState  *string `json:"license_plate_state"`
	LicensePlate       *string `json:"license_plate"`
} 