import { Breadcrumbs, BreadcrumbItem } from '@heroui/react'
import { useLocation, Link } from 'react-router-dom'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  catalog: 'Catalog',
  import: 'Import',
  orders: 'Orders',
  inventory: 'Inventory',
  transfer: 'Transfer',
  repricing: 'Repricing',
  writeoff: 'Write-Off',
  suppliers: 'Suppliers',
  sales: 'Sales',
  customers: 'Customers',
  crm: 'CRM',
  marketing: 'Marketing',
  reports: 'Reports',
  finance: 'Finance',
  management: 'Management',
  settings: 'Settings',
  roles: 'Roles',
  users: 'Users',
  'hr-management': 'HR Management',
  employees: 'Employees',
}

function labelize(segment: string) {
  const spaced = segment.split('-').join(' ')
  return LABELS[segment] || spaced.replace(/\b\w/g, (s: string) => s.toUpperCase())
}

export default function CustomBreadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((p, i) => ({
    to: '/' + parts.slice(0, i + 1).join('/'),
    label: labelize(p),
  }))
  return (
    <Breadcrumbs variant="solid" itemClasses={{ separator: 'px-1' }}>
      <BreadcrumbItem key="home"><Link to="/dashboard">Home</Link></BreadcrumbItem>
      {crumbs.map(c => (
        <BreadcrumbItem key={c.to}><Link to={c.to}>{c.label}</Link></BreadcrumbItem>
      ))}
    </Breadcrumbs>
  )
} 