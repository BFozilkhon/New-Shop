import type { ElementType } from 'react'
import {
  HomeIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ChartBarSquareIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'

export type SidebarChild = { key: string; label: string; to: string }
export type SidebarSection = { key: string; label: string; icon: ElementType; to?: string; children?: SidebarChild[] }

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon, to: '/dashboard' },
  {
    key: 'products', label: 'Products', icon: Squares2X2Icon, children: [
      { key: 'catalog', label: 'Catalog', to: '/products/catalog' },
      { key: 'archived', label: 'Archived Products', to: '/products/catalog/archive' },
      { key: 'catalog-management', label: 'Catalog Management', to: '/catalog-management' },
      { key: 'import', label: 'Import', to: '/products/import' },
      { key: 'orders', label: 'Orders', to: '/products/orders' },
      { key: 'inventory', label: 'Inventory', to: '/products/inventory' },
      { key: 'transfer', label: 'Transfer', to: '/products/transfer' },
      { key: 'repricing', label: 'Repricing', to: '/products/repricing' },
      { key: 'writeoff', label: 'Write-Off', to: '/products/writeoff' },
      { key: 'suppliers', label: 'Suppliers', to: '/products/suppliers' },
    ]
  },
  {
    key: 'sales', label: 'Sales', icon: ClipboardDocumentListIcon, children: [
      { key: 'new', label: 'New Sale', to: '/sales/new' },
      { key: 'all', label: 'All Sales', to: '/sales' },
      { key: 'shifts', label: 'Cashbox shifts', to: '/sales/cashbox/shifts' },
      { key: 'ops', label: 'Cashbox operations', to: '/sales/cashbox/operations' },
    ]
  },
  {
    key: 'customers', label: 'Customers', icon: UserGroupIcon, children: [
      { key: 'list', label: 'Customers List', to: '/customers' },
      { key: 'groups', label: 'Customer groups', to: '/customers/groups' },
      { key: 'loyalty', label: 'Loyalty program', to: '/customers/loyalty' },
      { key: 'debts', label: "Customers' debts", to: '/customers/debts' },
    ]
  },
  {
    key: 'crm', label: 'CRM', icon: UserGroupIcon, children: [
      { key: 'leads', label: 'Leads', to: '/crm/leads' },
      { key: 'events', label: 'Events', to: '/crm/events' },
      { key: 'calendar', label: 'Calendar', to: '/crm/calendar' },
      { key: 'auto', label: 'Auto Responder', to: '/crm/auto-responder' },
      { key: 'contacts', label: 'Contacts', to: '/crm/contacts' },
    ]
  },
  {
    key: 'marketing', label: 'Marketing', icon: MegaphoneIcon, children: [
      { key: 'promotion', label: 'Promotion', to: '/marketing/promotion' },
      { key: 'promocodes', label: 'Promo codes', to: '/marketing/promocodes' },
      { key: 'sms', label: 'SMS mailing', to: '/marketing/sms' },
      { key: 'giftcards', label: 'Gift Cards', to: '/marketing/gift-cards' },
    ]
  },
  {
    key: 'shop', label: 'Shop', icon: BuildingStorefrontIcon, children: [
      { key: 'service', label: 'Shop Service', to: '/shop/service' },
      { key: 'customer', label: 'Shop Customer', to: '/shop/customers' },
      { key: 'vendor', label: 'Shop Vendor', to: '/shop/vendors' },
    ]
  },
  {
    key: 'reports', label: 'Reports', icon: ChartBarSquareIcon, children: [
      { key: 'fav', label: 'Favourites', to: '/reports/favourites' },
      { key: 'shop', label: 'Shop', to: '/reports/shop' },
      { key: 'products', label: 'Products', to: '/reports/products' },
      { key: 'sellers', label: 'Sellers', to: '/reports/sellers' },
      { key: 'customers', label: 'Customers', to: '/reports/customers' },
      { key: 'leads', label: 'Leads', to: '/reports/leads' },
      { key: 'deals', label: 'Deals', to: '/reports/deals' },
      { key: 'finance', label: 'Finance', to: '/reports/finance' },
    ]
  },
  {
    key: 'finance', label: 'Finance', icon: BanknotesIcon, children: [
      { key: 'categories', label: 'Finance Categories', to: '/finance/categories' },
      { key: 'transactions', label: 'Financial transactions', to: '/finance/transactions' },
      { key: 'accounts', label: 'State of accounts', to: '/finance/accounts' },
    ]
  },
  {
    key: 'hrm', label: 'HR Management', icon: UserGroupIcon, children: [
      { key: 'employees', label: 'Employees', to: '/hr-management/employees' },
      { key: 'roles', label: 'Roles', to: '/hr-management/roles' },
    ]
  },
  {
    key: 'settings', label: 'Settings', icon: Cog6ToothIcon, children: [
      { key: 'profile', label: 'Profile', to: '/settings/profile' },
      { key: 'company', label: 'Company', to: '/settings/company' },
      { key: 'stores', label: 'Stores', to: '/settings/stores' },
      { key: 'integrations', label: 'Integrations', to: '/settings/integrations' },
      { key: 'pricetags', label: 'Price Tags', to: '/settings/pricetags' },
      { key: 'exchange-rates', label: 'Exchange Rate History', to: '/settings/exchange-rates' },
    ]
  },
] 