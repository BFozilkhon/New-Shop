import { useState, useMemo } from 'react'
import { Button, Input, Card, CardBody } from '@heroui/react'

export default function ProfilePage(){
  const [password, setPassword] = useState('')
  const user = useMemo(()=> { try { return JSON.parse(localStorage.getItem('sa_user')||'null') } catch { return null } }, [])
  const lastLogin = useMemo(()=> localStorage.getItem('sa_last_login'), [])

  const logout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_user')
    window.location.href = '/login'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Profile</h2>

      <Card className="max-w-xl">
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input isReadOnly label="Name" value={user?.name || 'Super Admin'} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
            <Input isReadOnly label="Email" value={user?.email || 'super_admin@gmail.com'} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
          </div>
          <Input isReadOnly label="Last entrance" value={lastLogin ? new Date(lastLogin).toLocaleString() : '-'} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        
          <div className="max-w-xl space-y-3">
        <Input label="Change Password" type="password" value={password} onValueChange={setPassword} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        <div className="flex gap-2">
          <Button color="primary">Save</Button>
          <Button color="danger" variant="flat" onPress={logout}>Log out</Button>
        </div>
      </div>
        </CardBody>
      </Card>

      
    </div>
  )
} 