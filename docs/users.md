### Users Module (Backend + Frontend)

- **Purpose**: Manage employees/users (list, view, create, update, delete) with pagination, search, and role linkage.

### Backend

- **Tech**: Go 1.22, Fiber, MongoDB, zap, bcrypt, jwt (auth elsewhere).
- **Models**: `internal/models/user.go`
  - `User`: Mongo entity (name, email, password_hash, role_id, phone, gender, date_of_birth, is_active, is_deleted, created_at, updated_at)
  - `UserDTO`: API shape (id, name, email, role_id, role_name, phone, gender, date_of_birth, is_active, is_deleted, created_at, updated_at)
  - `UserCreate`: name, email, password, role_id, phone?, gender?, date_of_birth?
  - `UserUpdate`: name?, email?, password?, role_id?, phone?, gender?, date_of_birth?, is_active?
- **Repository**: `internal/repositories/user_repository.go`
  - `List(ctx, UserListParams) ([]User, total, error)` with filter by `is_deleted:false`, search on `name|email`, optional `is_active` and sort/pagination.
  - `Get(ctx, id) (*User, error)`; `Create(ctx, *User) (*User, error)`; `Update(ctx, id, update bson.M) (*User, error)`; `Delete(ctx, id) error` (hard delete).
- **Service**: `internal/services/user_service.go`
  - `List`: maps to `UserDTO`; resolves `role_name` via `roles` repo (placeholder: admin name).
  - `Get`: returns single `UserDTO` with `role_name`.
  - `Create`: validates fields, hashes password with `utils.HashPassword`, inserts, returns `UserDTO` with phone/gender/date_of_birth.
  - `Update`: validates/converts fields, updates, returns `UserDTO`.
  - `Delete`: hard delete.
  - Errors use `utils.AppError` helpers: `BadRequest`, `Internal`, `NotFound`.
- **Handlers**: `internal/handlers/user_handler.go`
  - Routes registered under `/api` in `internal/routes/routes.go`.
  - `GET /api/users` query params: `page`, `limit`, `search`, `is_active`.
  - `GET /api/users/:id`
  - `POST /api/users` body `UserCreate`.
  - `PATCH /api/users/:id` body `UserUpdate`.
  - `DELETE /api/users/:id` → 204 No Content.
- **Indexes**: `internal/config/database.go` ensures users unique index on `email` (partial on `is_deleted:false`) and active/created_at compound index.

### Frontend

- **Tech**: React + Vite + TypeScript, HeroUI, TailwindCSS, TanStack Query, React Router (data router), Axios.
- **Service**: `src/services/usersService.ts`
  - `list({ page, limit, search, is_active }) -> { items, total }`
  - `get(id) -> User`
  - `create(payload) -> User`
  - `update(id, payload) -> User`
  - `remove(id)`
  - Uses `apiClient` to call `/api/users` endpoints.
- **Pages**:
  - `src/pages/users/UsersPage.tsx`
    - Renders `CustomTable` with search, pagination, column visibility, actions (view/edit/delete).
    - Uses `useSearchParams` to keep `page`, `limit`, `search` in URL.
    - Delete uses `ConfirmModal` then invalidates `['users']` query.
  - `src/pages/users/EmployeeCreatePage.tsx`
    - Multi-section create form (Profile, Stores and roles, Additional Info) with sticky nav and scroll sync.
    - Required: first/last name, email, password, confirm, role selection. Optional: phone, dob, gender.
    - On submit, constructs `name` as "First Last" and calls `usersService.create`.
  - `src/pages/users/EmployeeEditPage.tsx`
    - Loads user by `:id`, populates fields; supports view mode via `?mode=view`.
    - Updates name/email/role/phone/gender/date_of_birth via `usersService.update`.

### Data Flow

1. List: UI reads `page/limit/search` from URL → `usersService.list` → backend repo with filters → returns `{ items, total }` → table renders.
2. Create: Form validates → `usersService.create` posts payload → service hashes password and inserts → returns `UserDTO` → redirect to list, invalidate query.
3. Edit: Load `usersService.get` → bind to form → `usersService.update` → repo update → redirect back.
4. Delete: Confirm → `usersService.remove` → repo hard delete → 204 → invalidate list.

### API Examples

- List users
```bash
curl 'http://localhost:8081/api/users?page=1&limit=10&search='
```
- Get user
```bash
curl 'http://localhost:8081/api/users/<id>'
```
- Create user
```bash
curl -X POST 'http://localhost:8081/api/users' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Secret@123",
    "role_id": "<roleObjectId>",
    "phone": "+998971234567",
    "gender": "male",
    "date_of_birth": "1995-05-20"
  }'
```
- Update user
```bash
curl -X PATCH 'http://localhost:8081/api/users/<id>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Johnathan Doe",
    "phone": "+998991112233"
  }'
```
- Delete user
```bash
curl -X DELETE 'http://localhost:8081/api/users/<id>'
```

### Validation & Errors

- Backend returns structured errors: `{ code, message }` (e.g., `VALIDATION_ERROR`, `USER_NOT_FOUND`).
- Client surfaces errors via toasts.

### Notes

- Hard deletion is implemented (no `is_deleted` filtering during delete path).
- Phone, Gender, Date of Birth are persisted via `UserCreate`/`UserUpdate` and mapped in DTO.
- Role name resolution is simplified; replace with actual role lookup by `RoleID` for production. 