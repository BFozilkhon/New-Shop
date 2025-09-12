package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PriceTagTemplate defines a printable label template
// Properties are user-defined layers (text fields like name, sku, barcode) with positions and styles

type PriceTagTemplate struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID   string             `bson:"tenant_id" json:"tenant_id"`
	Name       string             `bson:"name" json:"name"`
	WidthMM    int                `bson:"width_mm" json:"width_mm"`
	HeightMM   int                `bson:"height_mm" json:"height_mm"`
	BarcodeFmt string             `bson:"barcode_fmt" json:"barcode_fmt"` // CODE128 | EAN13
	Properties []PriceTagProperty `bson:"properties" json:"properties"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}

type PriceTagProperty struct {
	Key      string  `bson:"key" json:"key"`       // name | sku | barcode | price | discount_price | custom:xyz
	Label    string  `bson:"label" json:"label"`
	X        float64 `bson:"x" json:"x"`           // relative [0..1]
	Y        float64 `bson:"y" json:"y"`           // relative [0..1]
	Width    float64 `bson:"width" json:"width"`   // relative [0..1]
	Height   float64 `bson:"height" json:"height"` // relative [0..1]
	Font     string  `bson:"font" json:"font"`
	FontSize int     `bson:"font_size" json:"font_size"`
	Align    string  `bson:"align" json:"align"` // left|center|right
	Bold     bool    `bson:"bold" json:"bold"`
}

// Requests

type PriceTagTemplateCreate struct {
	Name       string             `json:"name"`
	WidthMM    int                `json:"width_mm"`
	HeightMM   int                `json:"height_mm"`
	BarcodeFmt string             `json:"barcode_fmt"`
	Properties []PriceTagProperty `json:"properties"`
}

type PriceTagTemplateUpdate struct {
	Name       *string             `json:"name"`
	WidthMM    *int                `json:"width_mm"`
	HeightMM   *int                `json:"height_mm"`
	BarcodeFmt *string             `json:"barcode_fmt"`
	Properties *[]PriceTagProperty `json:"properties"`
} 