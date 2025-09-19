import { useMemo, useState, useEffect, useRef } from 'react'
import { Autocomplete, AutocompleteItem, Button } from '@heroui/react'
import { PlusIcon } from '@heroicons/react/24/outline'

export type CustomSelectItem = { key: string; label: string }

export type CustomSelectProps = {
  label?: string
  placeholder?: string
  items: CustomSelectItem[]
  value?: string
  onChange?: (key: string) => void
  isLoading?: boolean
  allowCreate?: boolean
  onCreate?: (term: string) => void
  disabled?: boolean
  className?: string
  classNames?: any
}

export default function CustomSelect({ label, placeholder, items, value, onChange, isLoading=false, allowCreate=true, onCreate, disabled=false, className, classNames }: CustomSelectProps) {
  const [term, setTerm] = useState('')
  const [instanceKey, setInstanceKey] = useState(0)
  const inputRef = useRef<HTMLInputElement|null>(null)
  const filtered = useMemo(()=> {
    const t = term.trim().toLowerCase()
    if (!t) return items
    return items.filter(i=> i.label.toLowerCase().includes(t))
  }, [items, term])

  // keep input text in sync with selected value
  useEffect(()=>{
    if (!value) { return }
    const found = items.find(i => String(i.key) === String(value))
    if (found) setTerm(found.label)
  }, [value, items])

  const handleCreate = () => {
    // remount to ensure dropdown closes and prevent stray popover beneath modals
    setInstanceKey(k=>k+1)
    try { inputRef.current?.blur() } catch {}
    if (onCreate) { onCreate(term) }
  }
  const empty = allowCreate && onCreate && term.trim() ? (
    <div className="py-1">
      <Button className="h-10" fullWidth variant="flat" color="primary" startContent={<PlusIcon className="h-4 w-4" />} onPress={handleCreate}>
        Create "{term}"
      </Button>
    </div>
  ) : 'No results'

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowCreate && onCreate && term.trim() && filtered.length === 0) {
      e.preventDefault()
      e.stopPropagation()
      handleCreate()
    }
  }

  const focusInput = () => { try { inputRef.current?.focus() } catch {} }

  return (
    <div className={className} onClick={focusInput}>
      <Autocomplete
        key={instanceKey}
        label={label}
        placeholder={placeholder || 'Select...'}
        selectedKey={value || null}
        onSelectionChange={(key)=> { const k = String(key || ''); onChange && onChange(k); const f = items.find(i=> String(i.key)===k); if (f) setTerm(f.label) }}
        inputValue={term}
        onInputChange={setTerm}
        onKeyDown={onKeyDown}
        variant="bordered"
        classNames={{ inputWrapper:'h-14', ...classNames }}
        items={filtered}
        listboxProps={{ emptyContent: empty }}
        isDisabled={disabled}
        isLoading={isLoading}
        allowsEmptyCollection
        menuTrigger="focus"
        shouldCloseOnBlur
      >
        {(item: CustomSelectItem)=> (<AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>)}
      </Autocomplete>
      {/* Hidden input to get a handle for focusing */}
      <input ref={inputRef} className="hidden" />
    </div>
  )
} 