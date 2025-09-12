package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService struct { repo *repositories.UserRepository; roles *repositories.RoleRepository }

func NewUserService(repo *repositories.UserRepository, roles *repositories.RoleRepository) *UserService { return &UserService{repo: repo, roles: roles} }

func (s *UserService) List(ctx context.Context, page, limit int64, search string, isActive *bool, roleKey string) ([]models.UserDTO, int64, error) {
	var roleIDPtr *primitive.ObjectID
	if roleKey != "" {
		if r, err := s.roles.GetByKey(ctx, roleKey); err == nil && r != nil {
			roleIDPtr = &r.ID
		}
	}
	items, total, err := s.repo.List(ctx, repositories.UserListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "created_at", Value: -1}}, Search: search, IsActive: isActive, RoleID: roleIDPtr })
	if err != nil { return nil, 0, utils.Internal("USER_LIST_FAILED", "Unable to list users", err) }
	out := make([]models.UserDTO, len(items))
	for i, u := range items {
		roleName := ""
		if u.RoleID != primitive.NilObjectID {
			if r, err := s.roles.Get(ctx, u.RoleID); err == nil && r != nil { roleName = r.Name }
		}
		out[i] = models.UserDTO{ ID: u.ID.Hex(), Name: u.Name, Email: u.Email, Avatar: u.Avatar, RoleID: u.RoleID.Hex(), RoleName: roleName, IsActive: u.IsActive, IsDeleted: u.IsDeleted, PrefServiceMode: u.PrefServiceMode, PrefLanguage: u.PrefLanguage, CreatedAt: u.CreatedAt, UpdatedAt: u.UpdatedAt }
	}
	return out, total, nil
}

func (s *UserService) Get(ctx context.Context, id string) (*models.UserDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid user id", nil) }
	m, err := s.repo.Get(ctx, oid)
	if err != nil { return nil, utils.NotFound("USER_NOT_FOUND", "User not found", err) }
	roleName := ""
	if r, err := s.roles.Get(ctx, m.RoleID); err == nil && r != nil { roleName = r.Name }
	dto := &models.UserDTO{ ID: m.ID.Hex(), Name: m.Name, Email: m.Email, Avatar: m.Avatar, RoleID: m.RoleID.Hex(), RoleName: roleName, IsActive: m.IsActive, IsDeleted: m.IsDeleted, PrefServiceMode: m.PrefServiceMode, PrefLanguage: m.PrefLanguage, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt }
	return dto, nil
}

func (s *UserService) Create(ctx context.Context, body models.UserCreate) (*models.UserDTO, error) {
	if body.Name == "" || body.Email == "" || body.Password == "" || body.RoleID == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "name, email, password and role_id are required", nil)
	}
	roleOID, err := primitive.ObjectIDFromHex(body.RoleID)
	if err != nil { return nil, utils.BadRequest("INVALID_ROLE", "Invalid role id", nil) }
	hash, err := utils.HashPassword(body.Password)
	if err != nil { return nil, utils.Internal("HASH_FAILED", "Password hashing failed", err) }
	m := &models.User{ Name: body.Name, Email: body.Email, Avatar: body.Avatar, PasswordHash: hash, RoleID: roleOID, Phone: body.Phone, Gender: body.Gender, DateOfBirth: body.DateOfBirth, IsActive: true, IsDeleted: false }
	created, err := s.repo.Create(ctx, m)
	if err != nil { return nil, utils.Internal("USER_CREATE_FAILED", "Unable to create user", err) }
	roleName := ""
	if r, err := s.roles.Get(ctx, created.RoleID); err == nil && r != nil { roleName = r.Name }
	dto := &models.UserDTO{ ID: created.ID.Hex(), Name: created.Name, Email: created.Email, Avatar: created.Avatar, RoleID: created.RoleID.Hex(), RoleName: roleName, Phone: created.Phone, Gender: created.Gender, DateOfBirth: created.DateOfBirth, IsActive: created.IsActive, IsDeleted: created.IsDeleted, PrefServiceMode: created.PrefServiceMode, PrefLanguage: created.PrefLanguage, CreatedAt: created.CreatedAt, UpdatedAt: created.UpdatedAt }
	return dto, nil
}

func (s *UserService) Update(ctx context.Context, id string, body models.UserUpdate) (*models.UserDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid user id", nil) }
	update := bson.M{}
	if body.Name != nil { update["name"] = *body.Name }
	if body.Email != nil { update["email"] = *body.Email }
	if body.Avatar != nil { update["avatar"] = *body.Avatar }
	if body.RoleID != nil {
		rid, err := primitive.ObjectIDFromHex(*body.RoleID)
		if err != nil { return nil, utils.BadRequest("INVALID_ROLE", "Invalid role id", nil) }
		update["role_id"] = rid
	}
	if body.IsActive != nil { update["is_active"] = *body.IsActive }
	if body.Phone != nil { update["phone"] = *body.Phone }
	if body.Gender != nil { update["gender"] = *body.Gender }
	if body.DateOfBirth != nil { update["date_of_birth"] = *body.DateOfBirth }
	if body.PrefServiceMode != nil { update["pref_service_mode"] = *body.PrefServiceMode }
	if body.PrefLanguage != nil { update["pref_language"] = *body.PrefLanguage }
	updated, err := s.repo.Update(ctx, oid, update)
	if err != nil { return nil, utils.Internal("USER_UPDATE_FAILED", "Unable to update user", err) }
	roleName := ""
	if r, err := s.roles.Get(ctx, updated.RoleID); err == nil && r != nil { roleName = r.Name }
	dto := &models.UserDTO{ ID: updated.ID.Hex(), Name: updated.Name, Email: updated.Email, Avatar: updated.Avatar, RoleID: updated.RoleID.Hex(), RoleName: roleName, Phone: updated.Phone, Gender: updated.Gender, DateOfBirth: updated.DateOfBirth, IsActive: updated.IsActive, IsDeleted: updated.IsDeleted, PrefServiceMode: updated.PrefServiceMode, PrefLanguage: updated.PrefLanguage, CreatedAt: updated.CreatedAt, UpdatedAt: updated.UpdatedAt }
	return dto, nil
}

func (s *UserService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return utils.BadRequest("INVALID_ID", "Invalid user id", nil) }
	if err := s.repo.Delete(ctx, oid); err != nil { return utils.Internal("USER_DELETE_FAILED", "Unable to delete user", err) }
	return nil
} 