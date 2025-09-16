import { useMemo, useState, useEffect } from 'react'
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
  const filtered = useMemo(()=> {
    const t = term.trim().toLowerCase()
    if (!t) return items
    return items.filter(i=> i.label.toLowerCase().includes(t))
  }, [items, term])

  // keep input text in sync with selected value
  useEffect(()=>{
    if (!value) { setTerm(''); return }
    const found = items.find(i => String(i.key) === String(value))
    if (found) setTerm(found.label)
  }, [value, items])

  const handleCreate = () => { if (onCreate) onCreate(term) }
  const empty = allowCreate && onCreate && term.trim() ? (
    <div className="py-1">
      <Button className="h-10" fullWidth variant="flat" color="primary" startContent={<PlusIcon className="h-4 w-4" />} onPress={handleCreate}>
        Create "{term}"
      </Button>
    </div>
  ) : 'No results'

  return (
    <div className={className}>
      <Autocomplete
        label={label}
        placeholder={placeholder || 'Select...'}
        selectedKey={value || null}
        onSelectionChange={(key)=> { const k = String(key || ''); onChange && onChange(k); const f = items.find(i=> String(i.key)===k); if (f) setTerm(f.label) }}
        inputValue={term}
        onInputChange={setTerm}
        variant="bordered"
        classNames={{ inputWrapper:'h-14', ...classNames }}
        defaultItems={filtered}
        listboxProps={{ emptyContent: empty }}
        isDisabled={disabled}
        isLoading={isLoading}
      >
        {(item: CustomSelectItem)=> (<AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>)}
      </Autocomplete>
    </div>
  )
} 