package services

var orderServiceSingleton *OrderService

func SetOrderService(svc *OrderService) { orderServiceSingleton = svc }
func GetOrderService() (*OrderService, bool) { if orderServiceSingleton == nil { return nil, false }; return orderServiceSingleton, true } 