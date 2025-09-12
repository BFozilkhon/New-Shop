import { useMemo } from 'react'
import { Switch, Checkbox } from '@heroui/react'
import type { PermissionGroup } from '../../services/rolesService'

const ACTIONS = ['access', 'create', 'update', 'delete'] as const
const keyFor = (base: string, action: typeof ACTIONS[number]) => `${base}.${action}`

export default function PermissionSelector({
  groups,
  value,
  onChange,
  disabled,
}: {
  groups: PermissionGroup[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const valueSet = useMemo(() => new Set(value), [value])

  const allKeysByGroup = useMemo(() => {
    const map: Record<string, string[]> = {}
    groups.forEach(g => {
      const keys: string[] = []
      g.items.forEach(i => ACTIONS.forEach(a => keys.push(keyFor(i.key, a))))
      map[g.key] = keys
    })
    return map
  }, [groups])

  const isGroupOn = (gKey: string) => {
    const keys = allKeysByGroup[gKey] || []
    return keys.length > 0 && keys.every(k => valueSet.has(k))
  }

  const toggleGroup = (gKey: string, on: boolean) => {
    const keys = new Set(value)
    const groupKeys = allKeysByGroup[gKey] || []
    if (on) groupKeys.forEach(k => keys.add(k))
    else groupKeys.forEach(k => keys.delete(k))
    onChange(Array.from(keys))
  }

  const toggleItem = (baseKey: string, action: typeof ACTIONS[number], on: boolean) => {
    const k = keyFor(baseKey, action)
    const keys = new Set(value)
    if (on) keys.add(k)
    else keys.delete(k)
    onChange(Array.from(keys))
  }

  return (
    <div className="space-y-8">
      {groups.map(g => (
        <div key={g.key} className="bg-content2/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{g.name}</h3>
            <Switch isSelected={isGroupOn(g.key)} onValueChange={(v) => toggleGroup(g.key, v)} size="sm" color="primary" isDisabled={disabled} />
          </div>
          <div className="mt-3 space-y-2">
            {g.items.map(it => (
              <div key={it.key} className="flex items-center justify-between gap-4 px-3 py-2 rounded-md bg-content1/40">
                <span className="text-sm font-medium">{it.name}</span>
                <div className="flex items-center gap-4">
                  {ACTIONS.map(a => (
                    <Checkbox
                      key={a}
                      isSelected={valueSet.has(keyFor(it.key, a))}
                      onValueChange={(v) => toggleItem(it.key, a, v)}
                      radius="full"
                      size="sm"
                      isDisabled={disabled}
                    >
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 