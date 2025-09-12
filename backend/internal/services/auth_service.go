package services

import (
	"context"
	"errors"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"
)

type AuthService struct { users *repositories.UserRepository; roles *repositories.RoleRepository }

func NewAuthService(users *repositories.UserRepository, roles *repositories.RoleRepository) *AuthService { return &AuthService{users: users, roles: roles} }

func (s *AuthService) BuildUserDTO(ctx context.Context, u *models.User) (models.UserDTO, []string, error) {
	roleName := ""
	perms := []string{}
	if u.RoleID != (models.User{}).RoleID {
		if r, err := s.roles.Get(ctx, u.RoleID); err == nil && r != nil {
			roleName = r.Name
			perms = append(perms, r.Permissions...)
		}
	}
	dto := models.UserDTO{ ID: u.ID.Hex(), Name: u.Name, Email: u.Email, RoleID: u.RoleID.Hex(), RoleName: roleName, Phone: u.Phone, Gender: u.Gender, DateOfBirth: u.DateOfBirth, IsActive: u.IsActive, IsDeleted: u.IsDeleted, PrefServiceMode: u.PrefServiceMode, PrefLanguage: u.PrefLanguage, CreatedAt: u.CreatedAt, UpdatedAt: u.UpdatedAt }
	return dto, perms, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*models.LoginResponse, error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil { return nil, utils.Unauthorized("INVALID_CREDENTIALS", "Invalid email or password", err) }
	if !utils.CheckPasswordHash(password, u.PasswordHash) { return nil, utils.Unauthorized("INVALID_CREDENTIALS", "Invalid email or password", errors.New("bad password")) }
	// token embeds user id for middleware
	token := u.ID.Hex() + "." + time.Now().UTC().Format("20060102150405")
	dto := models.UserDTO{ ID: u.ID.Hex(), Name: u.Name, Email: u.Email, RoleID: u.RoleID.Hex(), RoleName: "", Phone: u.Phone, Gender: u.Gender, DateOfBirth: u.DateOfBirth, IsActive: u.IsActive, IsDeleted: u.IsDeleted, PrefServiceMode: u.PrefServiceMode, PrefLanguage: u.PrefLanguage, CreatedAt: u.CreatedAt, UpdatedAt: u.UpdatedAt }
	return &models.LoginResponse{ Token: token, User: dto }, nil
} 