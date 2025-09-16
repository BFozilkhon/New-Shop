import { Button, Card, CardBody, Checkbox, Input } from '@heroui/react'
import { useState } from 'react'
import { useAuth } from '../../store/auth'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setLoading(true)
    try {
      await login(email, password, remember)
      toast.success('Welcome back!')
      navigate('/products/catalog', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#ff7ab6,#9b5cff)' }}>
      <Card className="w-full max-w-[420px] bg-content1/90 backdrop-blur-md">
        <CardBody className="p-6">
          <div className="text-xl font-semibold mb-4">Log In</div>
          <div className="space-y-4">
            <Input label="Email Address" labelPlacement="inside" isRequired variant="bordered" placeholder="Enter your email" value={email} onValueChange={setEmail} fullWidth />
            <Input
              label="Password"
              labelPlacement="inside"
              isRequired
              variant="bordered"
              placeholder="Enter your password"
              value={password}
              onValueChange={setPassword}
              type={show ? 'text' : 'password'}
              endContent={
                <button type="button" onClick={() => setShow(s => !s)} className="text-default-400">
                  {show ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              }
              fullWidth
            />
            <div className="flex items-center justify-between">
              <Checkbox isSelected={remember} onValueChange={setRemember}>Remember me</Checkbox>
              <button className="text-sm text-default-500">Forgot password?</button>
            </div>

            <Button color="primary" onPress={onSubmit} isLoading={loading} fullWidth>Log In</Button>
            <div className="flex items-center gap-2 my-2">
              <div className="h-px flex-1 bg-default-200" />
              <span className="text-xs text-default-500">OR</span>
              <div className="h-px flex-1 bg-default-200" />
            </div>
            <Button variant="bordered" fullWidth startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}>Continue with Google</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
} 