package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Tenant struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Subdomain   string             `bson:"subdomain" json:"subdomain"`
	CompanyName string             `bson:"company_name" json:"company_name"`
	Email       string             `bson:"email" json:"email"`
	Phone       string             `bson:"phone" json:"phone"`
	Status      TenantStatus       `bson:"status" json:"status"`
	Plan        TenantPlan         `bson:"plan" json:"plan"`
	Settings    TenantSettings     `bson:"settings" json:"settings"`
	BillingInfo BillingInfo        `bson:"billing_info" json:"billing_info"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	ExpiresAt   *time.Time         `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
}

type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "active"
	TenantStatusSuspended TenantStatus = "suspended"
	TenantStatusTrial     TenantStatus = "trial"
	TenantStatusExpired   TenantStatus = "expired"
	TenantStatusCanceled  TenantStatus = "canceled"
)

type TenantPlan string

const (
	PlanFree       TenantPlan = "free"
	PlanStarter    TenantPlan = "starter"
	PlanBusiness   TenantPlan = "business"
	PlanEnterprise TenantPlan = "enterprise"
)

type TenantSettings struct {
	Language      string               `bson:"language" json:"language"`
	Timezone      string               `bson:"timezone" json:"timezone"`
	Currency      string               `bson:"currency" json:"currency"`
	DateFormat    string               `bson:"date_format" json:"date_format"`
	Logo          string               `bson:"logo" json:"logo"`
	BrandColors   BrandColors          `bson:"brand_colors" json:"brand_colors"`
	Features      []string             `bson:"features" json:"features"`
	Integrations  map[string]bool      `bson:"integrations" json:"integrations"`
	Notifications NotificationSettings `bson:"notifications" json:"notifications"`
}

type BrandColors struct {
	Primary   string `bson:"primary" json:"primary"`
	Secondary string `bson:"secondary" json:"secondary"`
	Accent    string `bson:"accent" json:"accent"`
}

type NotificationSettings struct {
	Email    bool `bson:"email" json:"email"`
	SMS      bool `bson:"sms" json:"sms"`
	Push     bool `bson:"push" json:"push"`
	Telegram bool `bson:"telegram" json:"telegram"`
}

type BillingInfo struct {
	CompanyName   string     `bson:"company_name" json:"company_name"`
	TaxID         string     `bson:"tax_id" json:"tax_id"`
	Address       Address    `bson:"address" json:"address"`
	PaymentMethod string     `bson:"payment_method" json:"payment_method"`
	NextBillingAt *time.Time `bson:"next_billing_at" json:"next_billing_at"`
	LastPaymentAt *time.Time `bson:"last_payment_at" json:"last_payment_at"`
	MonthlyAmount float64    `bson:"monthly_amount" json:"monthly_amount"`
}

type Address struct {
	Country  string `bson:"country" json:"country"`
	City     string `bson:"city" json:"city"`
	Street   string `bson:"street" json:"street"`
	Building string `bson:"building" json:"building"`
	Zip      string `bson:"zip" json:"zip"`
}

type TenantUsage struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID    primitive.ObjectID `bson:"tenant_id" json:"tenant_id"`
	Period      time.Time          `bson:"period" json:"period"`
	Users       int                `bson:"users" json:"users"`
	Products    int                `bson:"products" json:"products"`
	Orders      int                `bson:"orders" json:"orders"`
	Sales       int                `bson:"sales" json:"sales"`
	Storage     int64              `bson:"storage" json:"storage"`
	APIRequests int                `bson:"api_requests" json:"api_requests"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
}

func GetDefaultTenantSettings() TenantSettings {
	return TenantSettings{
		Language:   "ru",
		Timezone:   "UTC+5",
		Currency:   "UZS",
		DateFormat: "DD.MM.YYYY",
		BrandColors: BrandColors{ Primary: "#3b82f6", Secondary: "#10b981", Accent: "#f59e0b" },
		Features: []string{"products","customers","sales","reports"},
		Integrations: map[string]bool{"telegram": false, "instagram": false, "email": true},
		Notifications: NotificationSettings{ Email: true, SMS: false, Push: true, Telegram: false },
	}
}

func ValidateSubdomain(subdomain string) bool {
	if len(subdomain) < 3 || len(subdomain) > 20 { return false }
	for _, ch := range subdomain {
		if !((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-') { return false }
	}
	if subdomain[0] == '-' || subdomain[len(subdomain)-1] == '-' { return false }
	return true
} 