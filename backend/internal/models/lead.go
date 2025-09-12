package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Lead struct {
	ID               primitive.ObjectID   `bson:"_id,omitempty"`
	TenantID         primitive.ObjectID   `bson:"tenant_id"`

	// Names
	Title            string               `bson:"title"`
	Name             string               `bson:"name,omitempty"`
	Description      string               `bson:"description,omitempty"`

	// Company & Contact
	Company          string               `bson:"company,omitempty"`
	CompanyName      string               `bson:"company_name,omitempty"`
	CustomerName     string               `bson:"customer_name,omitempty"`
	ContactName      string               `bson:"contact_name,omitempty"`
	ContactEmail     string               `bson:"contact_email,omitempty"`
	ContactPhone     string               `bson:"contact_phone,omitempty"`
	Contacts         []string             `bson:"contacts,omitempty"`

	// Pipeline & Status
	Stage            string               `bson:"stage"`
	Status           string               `bson:"status"`
	PipelineID       primitive.ObjectID   `bson:"pipeline_id,omitempty"`
	StatusID         primitive.ObjectID   `bson:"status_id,omitempty"`
	StatusName       string               `bson:"status_name,omitempty"`
	StatusColor      string               `bson:"status_color,omitempty"`

	// Financial
	Amount           float64              `bson:"amount,omitempty"`
	Value            float64              `bson:"value,omitempty"` // legacy
	Price            float64              `bson:"price,omitempty"`
	Currency         string               `bson:"currency,omitempty"`

	// Assignment
	OwnerID          primitive.ObjectID   `bson:"owner_id,omitempty"`
	AssignedTo       primitive.ObjectID   `bson:"assigned_to,omitempty"`
	ResponsibleUserID primitive.ObjectID  `bson:"responsible_user_id,omitempty"`
	ResponsibleUserName string            `bson:"responsible_user_name,omitempty"`
	CreatedByUserID  primitive.ObjectID   `bson:"created_by_user_id,omitempty"`
	CreatedByUserName string              `bson:"created_by_user_name,omitempty"`

	// Dates
	CreatedAt        time.Time            `bson:"created_at"`
	UpdatedAt        time.Time            `bson:"updated_at"`
	ClosedAt         *time.Time           `bson:"closed_at,omitempty"`
	ClosingDate      *time.Time           `bson:"closing_date,omitempty"`
	ExpectedCloseDate time.Time           `bson:"expected_close_date,omitempty"`
	LastContactedAt  *time.Time           `bson:"last_contacted_at,omitempty"`
	NextContactDate  *time.Time           `bson:"next_contact_date,omitempty"`

	// Source & Attribution
	Source           string               `bson:"source,omitempty"`
	SourceDetails    string               `bson:"source_details,omitempty"`
	UTMSource        string               `bson:"utm_source,omitempty"`
	UTMMedium        string               `bson:"utm_medium,omitempty"`
	UTMCampaign      string               `bson:"utm_campaign,omitempty"`
	UTMContent       string               `bson:"utm_content,omitempty"`
	UTMTerm          string               `bson:"utm_term,omitempty"`

	// Priority & Classification
	Priority         string               `bson:"priority,omitempty"` // legacy string
	PriorityInt      int                  `bson:"priority_int,omitempty"` // 1..4
	Probability      int                  `bson:"probability,omitempty"`
	LeadType         string               `bson:"lead_type,omitempty"`
	LeadQuality      string               `bson:"lead_quality,omitempty"`

	// Task & Activity
	HasOverdueTasks  bool                 `bson:"has_overdue_tasks,omitempty"`
	TasksCount       int                  `bson:"tasks_count,omitempty"`
	NotesCount       int                  `bson:"notes_count,omitempty"`
	Notes            string               `bson:"notes,omitempty"`
	CallsCount       int                  `bson:"calls_count,omitempty"`
	EmailsCount      int                  `bson:"emails_count,omitempty"`
	MeetingsCount    int                  `bson:"meetings_count,omitempty"`
	LastActivityType string               `bson:"last_activity_type,omitempty"`
	LastActivity     time.Time            `bson:"last_activity,omitempty"`
	LastActivityAt   *time.Time           `bson:"last_activity_at,omitempty"`

	// Tags & Custom
	Tags             []string             `bson:"tags,omitempty"`
	CustomFields     map[string]interface{} `bson:"custom_fields,omitempty"`

	// Loss info
	LossReason       string               `bson:"loss_reason,omitempty"`
	LossReasonID     primitive.ObjectID   `bson:"loss_reason_id,omitempty"`

	// Integrations
	ExternalID       string               `bson:"external_id,omitempty"`

	// Flags
	IsArchived       bool                 `bson:"is_archived,omitempty"`
	IsDeleted        bool                 `bson:"is_deleted"`

	// Links
	LinkedCompanyID  primitive.ObjectID   `bson:"linked_company_id,omitempty"`
	LinkedContactsIDs []primitive.ObjectID `bson:"linked_contacts_ids,omitempty"`
}

type LeadDTO struct {
	ID                string                 `json:"id"`
	Title             string                 `json:"title"`
	Name              string                 `json:"name"`
	Description       string                 `json:"description,omitempty"`
	Company           string                 `json:"company,omitempty"`
	CompanyName       string                 `json:"company_name,omitempty"`
	CustomerName      string                 `json:"customer_name,omitempty"`
	ContactName       string                 `json:"contact_name,omitempty"`
	ContactEmail      string                 `json:"contact_email,omitempty"`
	ContactPhone      string                 `json:"contact_phone,omitempty"`
	Contacts          []string               `json:"contacts,omitempty"`
	Amount            float64                `json:"amount,omitempty"`
	Price             float64                `json:"price,omitempty"`
	Currency          string                 `json:"currency,omitempty"`
	Status            string                 `json:"status"`
	Stage             string                 `json:"stage"`
	Priority          string                 `json:"priority,omitempty"`
	PriorityInt       int                    `json:"priority_int,omitempty"`
	Probability       int                    `json:"probability,omitempty"`
	Source            string                 `json:"source,omitempty"`
	SourceDetails     string                 `json:"source_details,omitempty"`
	ExpectedCloseDate time.Time              `json:"expected_close_date,omitempty"`
	ClosingDate       *time.Time             `json:"closing_date,omitempty"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
	Notes             string                 `json:"notes,omitempty"`
	Tags              []string               `json:"tags,omitempty"`
	CustomFields      map[string]interface{} `json:"custom_fields,omitempty"`
}

type LeadCreate struct {
	Title             string                 `json:"title"`
	Name              string                 `json:"name"`
	Description       string                 `json:"description,omitempty"`
	Company           string                 `json:"company,omitempty"`
	CompanyName       string                 `json:"company_name,omitempty"`
	CustomerName      string                 `json:"customer_name,omitempty"`
	ContactName       string                 `json:"contact_name,omitempty"`
	ContactEmail      string                 `json:"contact_email,omitempty"`
	ContactPhone      string                 `json:"contact_phone,omitempty"`
	Contacts          []string               `json:"contacts,omitempty"`
	Amount            float64                `json:"amount,omitempty"`
	Price             float64                `json:"price,omitempty"`
	Currency          string                 `json:"currency,omitempty"`
	Status            string                 `json:"status,omitempty"`
	Stage             string                 `json:"stage,omitempty"`
	OwnerID           string                 `json:"owner_id,omitempty"`
	AssignedTo        string                 `json:"assigned_to,omitempty"`
	Priority          string                 `json:"priority,omitempty"`
	PriorityInt       int                    `json:"priority_int,omitempty"`
	Probability       int                    `json:"probability,omitempty"`
	Source            string                 `json:"source,omitempty"`
	SourceDetails     string                 `json:"source_details,omitempty"`
	UTMSource         string                 `json:"utm_source,omitempty"`
	UTMMedium         string                 `json:"utm_medium,omitempty"`
	UTMCampaign       string                 `json:"utm_campaign,omitempty"`
	UTMContent        string                 `json:"utm_content,omitempty"`
	UTMTerm           string                 `json:"utm_term,omitempty"`
	ExpectedCloseDate string                 `json:"expected_close_date,omitempty"` // ISO
	ClosingDate       string                 `json:"closing_date,omitempty"`
	Notes             string                 `json:"notes,omitempty"`
	Tags              []string               `json:"tags,omitempty"`
	CustomFields      map[string]interface{} `json:"custom_fields,omitempty"`
}

type LeadUpdate struct {
	Title             *string                `json:"title"`
	Name              *string                `json:"name"`
	Description       *string                `json:"description"`
	Company           *string                `json:"company"`
	CompanyName       *string                `json:"company_name"`
	CustomerName      *string                `json:"customer_name"`
	ContactName       *string                `json:"contact_name"`
	ContactEmail      *string                `json:"contact_email"`
	ContactPhone      *string                `json:"contact_phone"`
	Contacts          *[]string              `json:"contacts"`
	Amount            *float64               `json:"amount"`
	Price             *float64               `json:"price"`
	Currency          *string                `json:"currency"`
	Status            *string                `json:"status"`
	Stage             *string                `json:"stage"`
	OwnerID           *string                `json:"owner_id"`
	AssignedTo        *string                `json:"assigned_to"`
	Priority          *string                `json:"priority"`
	PriorityInt       *int                   `json:"priority_int"`
	Probability       *int                   `json:"probability"`
	Source            *string                `json:"source"`
	SourceDetails     *string                `json:"source_details"`
	UTMSource         *string                `json:"utm_source"`
	UTMMedium         *string                `json:"utm_medium"`
	UTMCampaign       *string                `json:"utm_campaign"`
	UTMContent        *string                `json:"utm_content"`
	UTMTerm           *string                `json:"utm_term"`
	ExpectedCloseDate *string                `json:"expected_close_date"`
	ClosingDate       *string                `json:"closing_date"`
	Notes             *string                `json:"notes"`
	Tags              *[]string              `json:"tags"`
	CustomFields      *map[string]interface{} `json:"custom_fields"`
}

type PipelineStage struct {
	ID    primitive.ObjectID `bson:"_id,omitempty"`
	Key   string             `bson:"key"`
	Title string             `bson:"title"`
	Order int                `bson:"order"`
}