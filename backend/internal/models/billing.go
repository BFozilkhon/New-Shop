package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  primitive.ObjectID `bson:"tenant_id" json:"tenant_id"`
	Amount    float64            `bson:"amount" json:"amount"`
	Currency  string             `bson:"currency" json:"currency"`
	Method    string             `bson:"method" json:"method"`
	Status    string             `bson:"status" json:"status"`
	Note      string             `bson:"note" json:"note"`
	Period    string             `bson:"period" json:"period"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type PaymentDTO struct {
	ID        primitive.ObjectID `json:"id"`
	TenantID  primitive.ObjectID `json:"tenant_id"`
	Amount    float64            `json:"amount"`
	Currency  string             `json:"currency"`
	Method    string             `json:"method"`
	Status    string             `json:"status"`
	Note      string             `json:"note"`
	Period    string             `json:"period"`
	CreatedAt time.Time          `json:"created_at"`
}

type PaymentCreate struct {
	TenantID string  `json:"tenant_id"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Method   string  `json:"method"`
	Status   string  `json:"status"`
	Note     string  `json:"note"`
	Period   string  `json:"period"`
} 