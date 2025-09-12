import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Divider, Button } from '@heroui/react'
import { ChartBarSquareIcon, BuildingOffice2Icon, CreditCardIcon, BanknotesIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import logo from '../assets/images/logo.jpg'

const items = [
  { to: '/statistics', label: 'Statistics', Icon: ChartBarSquareIcon },
  { to: '/companies', label: 'Companies', Icon: BuildingOffice2Icon },
  { to: '/billing', label: 'Billing', Icon: CreditCardIcon },
  { to: '/finance', label: 'Finance', Icon: BanknotesIcon },
  { to: '/profile', label: 'Profile', Icon: UserCircleIcon },
]

function LinkRow({ to, label, Icon }: { to: string; label: string; Icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex mx-2 items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-600/40 text-sm ${isActive ? 'bg-blue-600/60 font-medium' : ''}`}
    >
      <Icon className="w-5 h-5 text-white" />
      <span className="text-white">{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const railWidth = collapsed ? 84 : 264

  return (
    <div className="h-screen flex bg-transparent">
      <aside className={`sticky top-0 h-screen transition-all duration-200 flex flex-col bg-black text-white`} style={{ width: railWidth }}>
        <div className="px-3 py-3 flex items-center justify-between ">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SA" className="w-8 h-8 rounded-full object-cover" />
            {!collapsed && <div className="font-semibold">SuperAdmin</div>}
          </div>
          <button className="p-1 rounded hover:bg-white/10" onClick={()=> setCollapsed(v=>!v)}>
            <Bars3Icon className="w-5 h-5 text-white" />
          </button>
        </div>
        <Divider className="bg-white/20" />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              {items.map(({to,label,Icon})=> (
                <Button key={to} isIconOnly variant="light" className="w-10 h-10 text-white" aria-label={label} onPress={()=>{ window.location.href = to }}>
                  <Icon className="w-5 h-5 text-white" />
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ to, label, Icon }) => (
                <LinkRow key={to} to={to} label={label} Icon={Icon} />
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
} 