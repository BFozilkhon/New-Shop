import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import { Input, Button, Checkbox } from '@heroui/react'
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import CategoryModal from '../../catalog/components/CategoryModal'

export type CategorySelectorProps = {
  value?: string[]
  onChange: (ids: string[], labels: string[]) => void
}

function collectAncestors(tree: Category[], id: string): string[] {
  const parentById: Record<string, string|undefined> = {}
  const fill = (nodes: Category[], parent?: string) => {
    for (const n of nodes || []) {
      parentById[n.id] = parent
      fill(n.children || [], n.id)
    }
  }
  fill(tree)
  const result: string[] = []
  let cur: string|undefined = id
  while (cur) { result.unshift(cur); cur = parentById[cur] }
  return result
}

export default function CategoryPicker({ value = [], onChange }: CategorySelectorProps) {
  const qc = useQueryClient()
  const { data: tree } = useQuery({ queryKey:['categories','tree'], queryFn: categoriesService.getTree })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)

  const filterTree = (nodes: Category[]): Category[] => {
    if (!search.trim()) return nodes
    const term = search.toLowerCase()
    const match = (n: Category) => n.name.toLowerCase().includes(term)
    const walk = (ns: Category[]): Category[] => ns.map(n => ({ ...n, children: walk(n.children || []) })).filter(n => match(n) || (n.children || []).length)
    return walk(nodes)
  }

  const filtered = useMemo(()=> filterTree(tree || []), [tree, search])

  const flatten = (nodes: Category[], depth = 0): any[] => {
    const rows: any[] = []
    for (const n of nodes || []) {
      rows.push({ id: n.id, name: n.name, depth, hasChildren: (n.children || []).length > 0, raw: n })
      if (expanded[n.id] && n.children?.length) rows.push(...flatten(n.children, depth+1))
    }
    return rows
  }

  const rows = useMemo(()=> flatten(filtered || []), [filtered, expanded])

  const selectedSet = new Set(value)

  const toggleSelect = (id: string, name: string) => {
    if (!tree) return
    const chain = collectAncestors(tree, id)
    const next = new Set(value)
    // if selecting, include chain; if deselecting, remove id only (retain explicitly selected ancestors)
    if (!selectedSet.has(id)) {
      chain.forEach(x => next.add(x))
    } else {
      next.delete(id)
    }
    onChange(Array.from(next), rows.filter(r => next.has(r.id)).map(r => r.name))
  }

  return (
    <div className="rounded-lg border border-default-200">
      <div className="p-3 flex items-center gap-2">
        <Input
          isClearable
          value={search}
          onValueChange={(v)=> setSearch(v)}
          onClear={()=> setSearch('')}
          placeholder="Category name"
          startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-500" />}
          className="w-full"
          classNames={{ inputWrapper: 'h-11' }}
        />
        <Button startContent={<PlusIcon className="w-4 h-4" />} onPress={()=> setModal(true)}>{'Add new category'}</Button>
      </div>

      <div className="divide-y divide-default-200">
        {rows.map(r => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-2">
            <div style={{ paddingLeft: r.depth * 20 }} className="flex items-center gap-2 flex-1">
              {r.hasChildren ? (
                <button className="p-1 rounded hover:bg-default-100" onClick={()=> setExpanded(s => ({ ...s, [r.id]: !s[r.id] }))}>
                  {expanded[r.id] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>
              ) : <span className="w-5" />}
              <Checkbox isSelected={selectedSet.has(r.id)} onValueChange={()=> toggleSelect(r.id, r.name)}>{r.name}</Checkbox>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal
        isOpen={modal}
        mode="create"
        onClose={()=> setModal(false)}
        onSuccess={()=> { setModal(false); qc.invalidateQueries({ queryKey:['categories'] }) }}
      />
    </div>
  )
} 