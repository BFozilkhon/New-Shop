import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import AppLayout from '../components/layouts/AppLayout'
import RolesPage from '../pages/roles/RolesPage'
import UsersPage from '../pages/users/UsersPage'
import LoginPage from '../pages/login/LoginPage'
import EmployeeCreatePage from '../pages/users/EmployeeCreatePage'
import EmployeeEditPage from '../pages/users/EmployeeEditPage'
import RoleCreatePage from '../pages/roles/RoleCreatePage'
import RoleEditPage from '../pages/roles/RoleEditPage'
import SuppliersPage from '../pages/suppliers/SuppliersPage'
import SupplierCreatePage from '../pages/suppliers/SupplierCreatePage'
import SupplierEditPage from '../pages/suppliers/SupplierEditPage'
import SupplierDetailPage from '../pages/suppliers/SupplierDetailPage'
import CompaniesPage from '../pages/companies/CompaniesPage'
import StoresPage from '../pages/stores/StoresPage'
import CompanyEditPage from '../pages/companies/CompanyEditPage'
import CompanyCreatePage from '../pages/companies/CompanyCreatePage'
import StoreEditPage from '../pages/stores/StoreEditPage'
import StoreCreatePage from '../pages/stores/StoreCreatePage'
import CatalogManagementPage from '../pages/catalog/CatalogManagementPage'
import ProductsPage from '../pages/products/ProductsPage'
import ProductCreatePage from '../pages/products/ProductCreatePage'
import ProductEditPage from '../pages/products/ProductEditPage'
import ImportListPage from '../pages/products/ImportListPage'
import ImportDetailPage from '../pages/products/ImportDetailPage'
import CustomersPage from '../pages/customers/CustomersPage'
import CustomerCreatePage from '../pages/customers/CustomerCreatePage'
import CustomerEditPage from '../pages/customers/CustomerEditPage'
import ProfilePage from '../pages/settings/ProfilePage'
import LeadsPage from '../pages/crm/LeadsPage'
import IntegrationsPage from '../pages/integrations/IntegrationsPage'
import OrdersPage from '../pages/orders/OrdersPage'
import OrderDetailPage from '../pages/orders/OrderDetailPage'
import OrderReturnsDetailPage from '../pages/orders/OrderReturnsDetailPage'
import ShopServicePage from '../pages/shop/service/ShopServicePage'
import ShopServiceCreatePage from '../pages/shop/service/ShopServiceCreatePage'
import ShopServiceEditPage from '../pages/shop/service/ShopServiceEditPage'
import ShopCustomersPage from '../pages/shop/customers/ShopCustomersPage'
import ShopCustomerCreatePage from '../pages/shop/customers/ShopCustomerCreatePage'
import ShopCustomerEditPage from '../pages/shop/customers/ShopCustomerEditPage'
import ShopCustomerParamsPage from '../pages/shop/customers/params/ShopCustomerParamsPage'
import ShopVendorsPage from '../pages/shop/vendors/ShopVendorsPage'
import ShopVendorCreatePage from '../pages/shop/vendors/ShopVendorCreatePage'
import ShopVendorEditPage from '../pages/shop/vendors/ShopVendorEditPage'
import ShopVendorParamsPage from '../pages/shop/vendors/params/ShopVendorParamsPage'
import ShopServiceEstimatePage from '../pages/shop/service/ShopServiceEstimatePage'
import InventoryPage from '../pages/inventory/InventoryPage'
import InventoryDetailPage from '../pages/inventory/InventoryDetailPage'
import { usePreferences } from '../store/prefs'
import WriteOffPage from '../pages/writeoff/WriteOffPage'
import WriteOffDetailPage from '../pages/writeoff/WriteOffDetailPage'
import RepricingPage from '../pages/repricing/RepricingPage'
import RepricingDetailPage from '../pages/repricing/RepricingDetailPage'
import TransferPage from '../pages/transfer/TransferPage'
import TransferDetailPage from '../pages/transfer/TransferDetailPage'
import PriceTagsPage from '../pages/settings/PriceTagsPage'
import PriceTagEditPage from '../pages/settings/PriceTagEditPage'
import ProductsArchivePage from '../pages/products/ProductsArchivePage'
import ExchangeRatesPage from '../pages/settings/ExchangeRatesPage'

function Protected({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? children : <Navigate to="/login" replace />
}

function WithServiceMode({ children }: { children: JSX.Element }) {
  const { prefs } = usePreferences()
  return prefs.serviceMode ? children : <Navigate to="/products/catalog" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Protected><AppLayout /></Protected>,
    children: [
      { index: true, element: <Navigate to="/products/catalog" replace /> },
      { path: 'dashboard', element: <div /> },
      { path: 'products/suppliers', element: <SuppliersPage /> },
      { path: 'products/suppliers/create', element: <SupplierCreatePage /> },
      { path: 'products/suppliers/:id', element: <SupplierDetailPage /> },
      { path: 'products/suppliers/:id/edit', element: <SupplierEditPage /> },
      { path: 'products/suppliers/:id/view', element: <SupplierEditPage /> },
      { path: 'products/catalog', element: <ProductsPage /> },
      { path: 'products/catalog/archive', element: <ProductsArchivePage /> },
      { path: 'products/orders', element: <OrdersPage /> },
      { path: 'products/orders/:id', element: <OrderDetailPage /> },
      { path: 'products/order-returns/:id', element: <OrderReturnsDetailPage /> },
      { path: 'products/import', element: <ImportListPage /> },
      { path: 'products/import/:id', element: <ImportDetailPage /> },
      { path: 'products/inventory', element: <InventoryPage /> },
      { path: 'products/inventory/:id', element: <InventoryDetailPage /> },
      { path: 'products/writeoff', element: <WriteOffPage /> },
      { path: 'products/writeoff/:id', element: <WriteOffDetailPage /> },
      { path: 'products/repricing', element: <RepricingPage /> },
      { path: 'products/repricing/:id', element: <RepricingDetailPage /> },
      { path: 'products/transfer', element: <TransferPage /> },
      { path: 'products/transfer/:id', element: <TransferDetailPage /> },
      { path: 'products/catalog/create', element: <ProductCreatePage /> },
      { path: 'products/catalog/:id/edit', element: <ProductEditPage /> },
      { path: 'products/catalog/:id/view', element: <ProductEditPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/create', element: <CustomerCreatePage /> },
      { path: 'customers/:id/edit', element: <CustomerEditPage /> },
      { path: 'customers/:id/view', element: <CustomerEditPage /> },
      { path: 'catalog-management', element: <CatalogManagementPage /> },
      { path: 'hr-management/employees', element: <UsersPage /> },
      { path: 'hr-management/employees/new', element: <EmployeeCreatePage /> },
      { path: 'hr-management/employees/create', element: <EmployeeCreatePage /> },
      { path: 'hr-management/employees/:id/edit', element: <EmployeeEditPage /> },
      { path: 'hr-management/employees/:id/view', element: <EmployeeEditPage /> },
      { path: 'hr-management/roles', element: <RolesPage /> },
      { path: 'hr-management/roles/create', element: <RoleCreatePage /> },
      { path: 'hr-management/roles/:id/edit', element: <RoleEditPage /> },
      { path: 'hr-management/roles/:id/view', element: <RoleEditPage /> },
      { path: 'settings/company', element: <CompaniesPage /> },
      { path: 'settings/company/create', element: <CompanyCreatePage /> },
      { path: 'settings/company/edit', element: <CompanyEditPage /> },
      { path: 'settings/company/view', element: <CompanyEditPage /> },
      { path: 'settings/stores', element: <StoresPage /> },
      { path: 'settings/stores/create', element: <StoreCreatePage /> },
      { path: 'settings/stores/edit', element: <StoreEditPage /> },
      { path: 'settings/stores/view', element: <StoreEditPage /> },
      { path: 'settings/users', element: <UsersPage /> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'settings/integrations', element: <IntegrationsPage /> },
      { path: 'settings/pricetags', element: <PriceTagsPage /> },
      { path: 'settings/pricetags/create', element: <PriceTagEditPage /> },
      { path: 'settings/pricetags/:id/edit', element: <PriceTagEditPage /> },
      { path: 'settings/exchange-rates', element: <ExchangeRatesPage /> },
      { path: 'crm/leads', element: <LeadsPage /> },
      { path: 'shop/service', element: <WithServiceMode><ShopServicePage /></WithServiceMode> },
      { path: 'shop/service/create', element: <WithServiceMode><ShopServiceCreatePage /></WithServiceMode> },
      { path: 'shop/service/:id/edit', element: <WithServiceMode><ShopServiceEditPage /></WithServiceMode> },
      { path: 'shop/service/:id/view', element: <WithServiceMode><ShopServiceEditPage /></WithServiceMode> },
      { path: 'shop/customers', element: <WithServiceMode><ShopCustomersPage /></WithServiceMode> },
      { path: 'shop/customers/create', element: <WithServiceMode><ShopCustomerCreatePage /></WithServiceMode> },
      { path: 'shop/customers/:id/edit', element: <WithServiceMode><ShopCustomerEditPage /></WithServiceMode> },
      { path: 'shop/customers/:id/view', element: <WithServiceMode><ShopCustomerParamsPage /></WithServiceMode> },
      { path: 'shop/vendors', element: <WithServiceMode><ShopVendorsPage /></WithServiceMode> },
      { path: 'shop/vendors/create', element: <WithServiceMode><ShopVendorCreatePage /></WithServiceMode> },
      { path: 'shop/vendors/:id/edit', element: <WithServiceMode><ShopVendorEditPage /></WithServiceMode> },
      { path: 'shop/vendors/:id/view', element: <WithServiceMode><ShopVendorParamsPage /></WithServiceMode> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/shop/service/:id/estimate', element: <Protected><WithServiceMode><ShopServiceEstimatePage /></WithServiceMode></Protected> },
])

export default function AppRoutes() { return <RouterProvider router={router} /> }
