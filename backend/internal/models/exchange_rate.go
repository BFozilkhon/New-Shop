package models

import (
	"time"
)

// ExchangeRate represents a tenant-scoped historical exchange rate entry.
// Rate is stored as integer UZS per 1 USD.
// The active period is [StartAt, EndAt) where EndAt is nil for current.
// We keep it separate from TenantSettings to ensure historical correctness of finance.

type ExchangeRate struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	TenantID  string    `bson:"tenant_id" json:"tenant_id"`
	Rate      int       `bson:"rate" json:"rate"` // UZS per 1 USD, integer
	StartAt   time.Time `bson:"start_at" json:"start_at"`
	EndAt     *time.Time `bson:"end_at,omitempty" json:"end_at,omitempty"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	CreatedBy string    `bson:"created_by,omitempty" json:"created_by,omitempty"`
}

// DTOs

type ExchangeRateCreate struct {
	Rate int `json:"rate"`
	// Optional explicit start time; if empty, server will use now.
	StartAt *time.Time `json:"start_at"`
}

type ExchangeRateDTO struct {
	ID      string     `json:"id"`
	Rate    int        `json:"rate"`
	StartAt time.Time  `json:"start_at"`
	EndAt   *time.Time `json:"end_at,omitempty"`
} 