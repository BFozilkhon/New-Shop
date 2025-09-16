import { Button, Input, Avatar, Badge, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem } from '@heroui/react'
import { useTheme } from '../../store/theme'
import { usePreferences } from '../../store/prefs'
import { useQuery } from '@tanstack/react-query'
import { storesService } from '../../services/storesService'
import { BellIcon, MagnifyingGlassIcon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../store/auth'
import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const { theme, setTheme } = useTheme()
  const { prefs, setSelectedStore } = usePreferences()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const storesQ = useQuery({ queryKey:['stores','topbar'], queryFn: ()=> storesService.list({ page:1, limit:200 }), placeholderData:(p)=>p })
  const storeItems = [{ key:'__ALL__', label:'ALL STORES' }, ...((storesQ.data?.items||[]).map((s:any)=> ({ key:s.id, label:s.title })))]
  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light')
  return (
    <div className="px-4 py-2 flex items-center gap-3">
      <div className="flex-1" />
      <div className="hidden md:flex max-w-xl flex-1"></div>
      {/* <Input
        placeholder="Search..."
        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
        variant="bordered"
        className="max-w-xs"
      /> */}
      <Select
        aria-label="Current store"
        variant="bordered"
        selectedKeys={prefs.selectedStoreId? [prefs.selectedStoreId] : ['__ALL__']}
        onSelectionChange={(keys)=>{ 
          const id=String(Array.from(keys)[0]||'')
          if (id==='__ALL__') { setSelectedStore(null, null) }
          else { const found=storeItems.find(s=>s.key===id); setSelectedStore(id||null, found?.label||null) }
        }}
        className="max-w-xs"
        classNames={{ trigger:'h-10', popoverContent:'z-[1100]' }}
      >
        {storeItems.map(it=> (<SelectItem key={it.key}>{it.label}</SelectItem>))}
      </Select>
      <Button isIconOnly variant="light" aria-label="toggle theme" onPress={toggle}>
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </Button>
      <Badge content="!" color="danger" shape="circle">
        <Button isIconOnly variant="light" aria-label="notifications">
          <BellIcon className="w-5 h-5" />
        </Button>
      </Badge>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar radius="md" size="sm" name="AA" className="cursor-pointer bg-primary-100 text-primary-600" />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile menu" onAction={(key)=>{ 
          if (key==='logout') { try { logout() } catch {} navigate('/login', { replace:true }) }
          if (key==='profile') { navigate('/settings/profile') }
        }}>
          <DropdownItem key="profile" startContent={<UserCircleIcon className="w-4 h-4" />}>Profile</DropdownItem>
          <DropdownItem key="help" startContent={<QuestionMarkCircleIcon className="w-4 h-4" />}>Help</DropdownItem>
          <DropdownItem key="logout" className="text-danger" color="danger" startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}>Logout</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
