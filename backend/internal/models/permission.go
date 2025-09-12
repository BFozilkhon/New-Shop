package models

type PermissionItem struct {
	Key  string `json:"key"`
	Name string `json:"name"`
}

type PermissionGroup struct {
	Key   string           `json:"key"`
	Name  string           `json:"name"`
	Items []PermissionItem `json:"items"`
} 