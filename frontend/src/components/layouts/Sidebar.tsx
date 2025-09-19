import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import type { ElementType } from 'react'
import { ChevronDownIcon, Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Accordion, AccordionItem, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Avatar, Divider, Button } from '@heroui/react'
import { SIDEBAR_SECTIONS } from '../../utils/sidebar'
import { useAuth } from '../../store/auth'
import { usePreferences } from '../../store/prefs'
import { useTranslation } from 'react-i18next'

function ItemLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `block px-3 py-2 rounded hover:bg-default-100 text-sm ${isActive ? 'bg-default-100 font-medium' : ''}`}
    >
      {label}
    </NavLink>
  )
}

function LinkRow({ to, label, Icon }: { to: string; label: string; Icon: ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex mx-2 items-center gap-3 px-3 py-2 rounded-lg hover:bg-default-100 text-sm ${isActive ? 'bg-primary-50 font-medium' : ''}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { auth, logout } = useAuth()
  const { prefs } = usePreferences()

  const hasAccess = (baseKey: string) => auth.permissions.includes(`${baseKey}.access`)

  const sections = useMemo(() => {
    const base = SIDEBAR_SECTIONS
      .filter(sec => sec.key !== 'shop' || prefs.serviceMode)
      .map(sec => ({
        ...sec,
        label: t(`sidebar.sections.${sec.key}.label`),
        to: sec.to,
        children: (sec.children || []).filter(ch => hasAccess(mapChildToPermBase(sec.key, ch.key))).map(ch => ({
          ...ch,
          label: t(`sidebar.sections.${sec.key}.children.${ch.key}`),
        }))
      }))
      .filter(sec => (sec.children && sec.children.length > 0) || (sec.to && hasAccess(mapSectionToPermBase(sec.key))))
    return base
  }, [auth.permissions, prefs.serviceMode, t])

  // Determine which accordion section should be open based on current route
  const initialOpenKey = useMemo(() => {
    const match = sections.find(s => (s.children ?? []).some(ch => pathname.startsWith(ch.to)))
    return match?.key ?? null
  }, [pathname, sections])

  const [openKey, setOpenKey] = useState<string | null>(initialOpenKey)

  useEffect(() => {
    setOpenKey(initialOpenKey)
  }, [initialOpenKey])

  const railWidth = collapsed ? 84 : 264

  // expose current sidebar width as CSS variable for layout sizing
  useEffect(() => {
    try { document.documentElement.style.setProperty('--sidebar-width', `${railWidth}px`) } catch {}
  }, [railWidth])

  // when collapsing, close any open accordion/dropdown
  const toggleCollapse = () => {
    setCollapsed(v => {
      const next = !v
      if (next) setOpenKey(null)
      return next
    })
  }

  const handleLogout = () => {
    try { logout() } catch {}
    navigate('/login', { replace: true })
  }

  return (
    <div className={`sticky top-0 h-screen transition-all duration-200 flex flex-col bg-transparent`} style={{ width: railWidth }}>
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/src/assets/images/logo.jpg" alt={t('sidebar.logo_alt')} className="w-8 h-8 rounded-full object-cover" />
          {!collapsed && <div className="font-semibold">SHOP</div>}
        </div>
        <button className="p-1 rounded hover:bg-default-100" onClick={toggleCollapse} aria-label={t('sidebar.toggle')}>
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>
      <Divider />

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            {sections.map(sec => {
              const Icon = sec.icon as any
              const items = [{ key: sec.to || '#', label: sec.label }, ...((sec.children || []).map(ch => ({ key: ch.to, label: ch.label })))]
              const isOpen = openKey === sec.key
              return (
                <Dropdown key={sec.key} placement="right-start" isOpen={isOpen} onOpenChange={(o) => setOpenKey(o ? sec.key : null)}>
                  <DropdownTrigger>
                    <Button isIconOnly variant="light" className="w-10 h-10" aria-label={sec.label} onMouseEnter={() => setOpenKey(sec.key)} onMouseLeave={() => setOpenKey(null)}>
                      <Icon className="w-5 h-5" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label={sec.label} items={items} onAction={(key) => { const path = String(key); if (path.startsWith('/')) navigate(path) }} onMouseEnter={() => setOpenKey(sec.key)} onMouseLeave={() => setOpenKey(null)}>
                    {(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
                  </DropdownMenu>
                </Dropdown>
              )})}
          </div>
        ) : (
          <div className="space-y-3">
            {sections.filter(s => !s.children || s.children.length === 0).map(s => (
              s.to ? <LinkRow key={s.key} to={s.to} label={s.label} Icon={s.icon as any} /> : null
            ))}
            <Accordion
              selectedKeys={openKey ? new Set([openKey]) : new Set()}
              onSelectionChange={(keys) => {
                const arr = Array.from(keys as Set<string>)
                setOpenKey(arr[0] ?? null)
              }}
              showDivider={false}
              selectionMode="single"
              className="space-y-3"
              itemClasses={{
                base: 'bg-transparent rounded-lg',
                trigger: 'px-3 py-2 h-auto',
                title: 'text-sm',
                content: 'pl-2 pr-2',
                indicator: 'text-default-500',
              }}
            >
              {sections.filter(s => s.children && s.children.length > 0).map(sec => {
                const Icon = sec.icon as any
                const hasActiveChild = (sec.children || []).some(ch => pathname.startsWith(ch.to))
                return (
                  <AccordionItem
                    key={sec.key}
                    aria-label={sec.label}
                    title={<div className={`flex items-center gap-2 ${hasActiveChild ? 'text-primary' : ''}`}><Icon className="w-5 h-5" /><span>{sec.label}</span></div>}
                    indicator={<ChevronDownIcon className="w-4 h-4" />}
                    className={hasActiveChild ? 'border-primary-200' : ''}
                  >
                    <div className="grid gap-1">
                      {(sec.children || []).map(ch => (
                        <ItemLink key={ch.key} to={ch.to} label={ch.label} />
                      ))}
                    </div>
                  </AccordionItem>
                )})}
            </Accordion>
          </div>
        )}
      </div>

      <div className={`px-3 py-3 flex flex-col gap-2 mt-auto ${collapsed ? 'items-center' : ''}`}>
        <Divider />
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Avatar size="sm" name="Kate Moore" />
          {!collapsed && (
            <div>
              <div className="text-sm font-medium leading-tight">Kate Moore</div>
              <div className="text-xs text-default-500 leading-tight">{t('sidebar.role_support')}</div>
            </div>
          )}
        </div>
        {collapsed ? (
          <Button isIconOnly variant="flat" color="danger" aria-label={t('common.logout')} onPress={handleLogout}>
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button fullWidth variant="flat" color="danger" startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />} onPress={handleLogout}>{t('common.logout')}</Button>
        )}
      </div>
    </div>
  )
}

function mapSectionToPermBase(sectionKey: string) {
  switch (sectionKey) {
    case 'hrm': return 'hr.users'
    case 'products': return 'products.catalog'
    case 'dashboard': return 'general.dashboard'
    case 'sales': return 'sales.all'
    case 'customers': return 'customers.list'
    case 'crm': return 'crm.leads'
    case 'marketing': return 'marketing.promotion'
    case 'shop': return 'shop.service'
    case 'reports': return 'reports.fav'
    case 'finance': return 'finance.categories'
    case 'settings': return 'settings.profile'
    default: return sectionKey
  }
}

function mapChildToPermBase(sectionKey: string, childKey: string) {
  if (sectionKey === 'hrm') {
    if (childKey === 'employees') return 'hr.users'
    if (childKey === 'roles') return 'hr.roles'
  }
  if (sectionKey === 'products') {
    if (childKey === 'suppliers') return 'products.suppliers'
    if (childKey === 'catalog') return 'products.catalog'
    if (childKey === 'catalog-management') return 'products.categories'
  }
  if (sectionKey === 'shop') {
    if (childKey === 'service') return 'shop.service'
    if (childKey === 'unit') return 'shop.unit'
    if (childKey === 'customer') return 'shop.customer'
    if (childKey === 'vendor') return 'shop.vendor'
  }
  if (sectionKey === 'settings' && childKey === 'company') return 'settings.company'
  if (sectionKey === 'settings' && childKey === 'stores') return 'settings.stores'
  if (sectionKey === 'settings' && (childKey === 'exchange-rates' || childKey === 'exchange_rates')) return 'settings.exchange_rates'
  return `${sectionKey}.${childKey}`
}
