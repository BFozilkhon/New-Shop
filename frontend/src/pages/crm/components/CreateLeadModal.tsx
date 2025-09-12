import { useMemo, useState } from 'react'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Select, SelectItem, DatePicker } from '@heroui/react'

export default function CreateLeadModal({ isOpen, onOpenChange, onCreate, defaultStatus, initial }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; onCreate: (payload:any)=>void; defaultStatus?: string; initial?: any }) {
  const [title, setTitle] = useState('')
  const [value, setValue] = useState<string>('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [probability, setProbability] = useState<String | any>('50')
  const [source, setSource] = useState('website')
  // store ISO string for backend
  const [expectedCloseISO, setExpectedCloseISO] = useState<string>('')

  useMemo(() => {
    if (!initial) return
    setTitle(initial.title || '')
    setDescription(initial.description || '')
    setValue(String(initial.amount ?? initial.value ?? ''))
    setPriority(initial.priority || 'medium')
    setProbability(String(initial.probability ?? '50'))
    setSource(initial.source || 'website')
    if (initial.expected_close_date) {
      try { setExpectedCloseISO(new Date(initial.expected_close_date).toISOString()) } catch {}
    }
  }, [initial])

  const handleSubmit = () => {
    const amountNum = Number(value)
    const payload: any = {
      title,
      description,
      amount: Number.isFinite(amountNum) ? amountNum : undefined,
      priority,
      probability: Number(probability) || 0,
      source,
      expected_close_date: expectedCloseISO || undefined,
      status: defaultStatus,
      stage: defaultStatus,
    }
    onCreate(payload)
    onOpenChange(false)
    setTitle('')
    setValue('')
    setDescription('')
    setPriority('medium')
    setProbability('50')
    setSource('website')
    setExpectedCloseISO('')
  }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title={initial ? 'Edit Lead' : 'Create Lead'} onSubmit={handleSubmit} submitLabel={initial ? 'Save' : 'Create'}>
      <div className="space-y-4">
        <Input label="Title" value={title} onValueChange={setTitle} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        <Input label="Description" value={description} onValueChange={setDescription} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" label="Amount" value={value} onValueChange={setValue} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
          <Input type="number" label="Probability %" value={String(probability)} onValueChange={setProbability} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        </div>
        <div className="grid gap-3">
          <DatePicker variant='bordered' aria-label="Expected Close Date" onChange={(d: any) => {
            try {
              // d.toString() -> YYYY-MM-DD (from HeroUI DateValue)
              const s = typeof d?.toString === 'function' ? d.toString() : String(d)
              const iso = new Date(`${s}T00:00:00Z`).toISOString()
              setExpectedCloseISO(iso)
            } catch { setExpectedCloseISO('') }
          }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select variant='bordered'  aria-label="Priority" selectedKeys={[priority]} onSelectionChange={(keys)=>setPriority(Array.from(keys)[0] as string)} classNames={{ trigger: 'h-12' }}>
            {['high','medium','low'].map(k => (<SelectItem key={k} textValue={k}>{k[0].toUpperCase()+k.slice(1)}</SelectItem>))}
          </Select>
          <Select variant='bordered' aria-label="Source" selectedKeys={[source]} onSelectionChange={(keys)=>setSource(Array.from(keys)[0] as string)} classNames={{ trigger: 'h-12' }}>
            {['website','phone','email','social','other'].map(k => (<SelectItem key={k} textValue={k}>{k[0].toUpperCase()+k.slice(1)}</SelectItem>))}
          </Select>
        </div>
      </div>
    </CustomModal>
  )
} 