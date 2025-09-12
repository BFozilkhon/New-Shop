package utils

import "net/http"

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"-"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string { return e.Message }

func NewAppError(code, msg string, status int, err error) *AppError { return &AppError{Code: code, Message: msg, Status: status, Err: err} }
func BadRequest(code, msg string, err error) *AppError   { return NewAppError(code, msg, http.StatusBadRequest, err) }
func Unauthorized(code, msg string, err error) *AppError { return NewAppError(code, msg, http.StatusUnauthorized, err) }
func Forbidden(code, msg string, err error) *AppError    { return NewAppError(code, msg, http.StatusForbidden, err) }
func NotFound(code, msg string, err error) *AppError     { return NewAppError(code, msg, http.StatusNotFound, err) }
func Conflict(code, msg string, err error) *AppError     { return NewAppError(code, msg, http.StatusConflict, err) }
func Internal(code, msg string, err error) *AppError     { return NewAppError(code, msg, http.StatusInternalServerError, err) } 