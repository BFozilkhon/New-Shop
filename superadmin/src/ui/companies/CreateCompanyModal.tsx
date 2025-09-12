import { useMemo, useState } from 'react'
import CustomModal from '../../components/common/CustomModal'
import { Input, Select, SelectItem } from '@heroui/react'
import { toast } from 'react-toastify'
import { apiClient } from '../../services/base/apiClient'

export default function CreateCompanyModal({ isOpen, onOpenChange, onSuccess }: { isOpen: boolean; onOpenChange: (open: boolean)=> void; onSuccess?: ()=> void }) {
  const [subdomain, setSubdomain] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [plan, setPlan] = useState<'free'|'starter'|'business'|'enterprise'>('starter')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPassword2, setAdminPassword2] = useState('')
  const [loading, setLoading] = useState(false)

  const plans = useMemo(() => ([
    { key: 'free', label: 'Free' },
    { key: 'starter', label: 'Starter' },
    { key: 'business', label: 'Business' },
    { key: 'enterprise', label: 'Enterprise' },
  ]), [])

  const validate = () => {
    const subOk = /^[a-z0-9-]{3,20}$/.test(subdomain)
    if (!subOk) { toast.error('Invalid subdomain. Use 3-20 chars: a-z, 0-9, -'); return false }
    if (!company) { toast.error('Company name is required'); return false }
    if (!email) { toast.error('Company email is required'); return false }
    if (!adminName) { toast.error('Admin name is required'); return false }
    if (!adminEmail) { toast.error('Admin email is required'); return false }
    if (!adminPassword || adminPassword.length < 6) { toast.error('Admin password must be at least 6 characters'); return false }
    if (adminPassword !== adminPassword2) { toast.error('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // 1) Create tenant
      const tenantBody = { subdomain, company_name: company, email, phone, plan, status: 'trial' }
      await apiClient.post('/api/tenants', tenantBody)
      // 2) Find admin role id
      const rolesRes = await apiClient.get('/api/roles', { params: { page: 1, limit: 50, search: 'admin' } })
      const roles = rolesRes.data?.data?.items || rolesRes.data?.data || []
      const adminRole = roles.find((r: any) => String(r.key).toLowerCase() === 'admin') || roles.find((r: any)=> /admin/i.test(r.name))
      if (!adminRole) { toast.error('Admin role not found'); return }
      // 3) Create admin user
      await apiClient.post('/api/users', { name: adminName, email: adminEmail, password: adminPassword, role_id: adminRole.id })
      toast.success('Tenant and admin created')
      onOpenChange(false)
      onSuccess && onSuccess()
      // reset
      setSubdomain(''); setCompany(''); setEmail(''); setPhone(''); setPlan('starter'); setAdminName(''); setAdminEmail(''); setAdminPassword(''); setAdminPassword2('')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to create tenant'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title="Create Company" onSubmit={handleSubmit} submitLabel="Create" isSubmitting={loading} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Subdomain" value={subdomain} onValueChange={setSubdomain} isRequired placeholder="e.g. acme" className="h-14"/>
          <Select label="Plan" selectedKeys={new Set([plan])} onSelectionChange={(keys)=> setPlan(String(Array.from(keys)[0]) as any)} className="h-14" items={plans} aria-label="Plan">
            {(item)=> <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company Name" value={company} onValueChange={setCompany} isRequired className="h-14"/>
          <Input label="Company Email" type="email" value={email} onValueChange={setEmail} isRequired className="h-14"/>
          <Input label="Phone" value={phone} onValueChange={setPhone} className="h-14"/>
        </div>

        <div className="border-t border-default-200"/>
        <div className="text-sm font-medium text-default-700">First admin</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Admin Name" value={adminName} onValueChange={setAdminName} isRequired className="h-14"/>
          <Input label="Admin Email" type="email" value={adminEmail} onValueChange={setAdminEmail} isRequired className="h-14"/>
          <Input label="Password" type="password" value={adminPassword} onValueChange={setAdminPassword} isRequired className="h-14"/>
          <Input label="Confirm Password" type="password" value={adminPassword2} onValueChange={setAdminPassword2} isRequired className="h-14"/>
        </div>
      </div>
    </CustomModal>
  )
} 