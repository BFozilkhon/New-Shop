import { useState } from 'react'
import { Button, Input, Card, CardBody } from '@heroui/react'
import axios from 'axios'

export default function LoginPage() {
  const [email, setEmail] = useState('super_admin@gmail.com')
  const [password, setPassword] = useState('super_admin123')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { email, password })
      const token = data?.data?.token || ''
      const user = data?.data?.user || null
      localStorage.setItem('sa_token', token)
      if (user) localStorage.setItem('sa_user', JSON.stringify(user))
      localStorage.setItem('sa_last_login', new Date().toISOString())
      window.location.href = '/'
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-content1">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4 p-6">
          <h1 className="text-xl font-semibold text-center">SuperAdmin Login</h1>
          <Input label="Email" value={email} onValueChange={setEmail} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
          <Input label="Password" type="password" value={password} onValueChange={setPassword} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
          <Button color="primary" isLoading={loading} onPress={submit}>Login</Button>
        </CardBody>
      </Card>
    </div>
  )
} 