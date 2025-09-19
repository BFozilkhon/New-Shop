import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import { Input, Button, Checkbox, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import CategoryModal from '../../catalog/components/CategoryModal'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { toast } from 'react-toastify'

export type CategorySelectorProps = {
  value?: string[]
  onChange: (ids: string[], labels: string[]) => void
}

function collectAncestorsMap(tree: Category[]): Record<string, string|undefined> {
  const parentById: Record<string, string|undefined> = {}
  const fill = (nodes: Category[], parent?: string) => {
    for (const n of nodes || []) { parentById[n.id] = parent; fill(n.children || [], n.id) }
  }
  fill(tree)
  return parentById
}

export default function CategoryPicker({ value = [], onChange }: CategorySelectorProps) {
  const qc = useQueryClient()
  const { data: tree } = useQuery({ queryKey:['categories','tree'], queryFn: categoriesService.getTree })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editCat, setEditCat] = useState<Category|undefined>(undefined)
  const [confirm, setConfirm] = useState<{ open:boolean; id?:string; name?:string }>({ open:false })
  const rowRefs = useRef<Record<string, HTMLDivElement|null>>({})
  const [focusId, setFocusId] = useState<string | undefined>(undefined)

  const parentById = useMemo(()=> collectAncestorsMap(tree || []), [tree])
  const idToName = useMemo(()=> {
    const map: Record<string, string> = {}
    const walk = (ns: Category[]|undefined) => { for (const n of ns || []) { map[n.id] = n.name; walk(n.children) } }
    walk(tree)
    return map
  }, [tree])

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

  const toggleSelect = (id: string) => {
    const next = new Set(value)
    if (!selectedSet.has(id)) {
      // selecting: include full ancestor chain
      const chain: string[] = []
      let cur: string|undefined = id
      while (cur) { chain.unshift(cur); cur = parentById[cur] }
      chain.forEach(x => next.add(x))
    } else {
      // deselect only this id (keep ancestors if explicitly selected)
      next.delete(id)
    }
    const ids = Array.from(next)
    const labels = ids.map(x => idToName[x]).filter(Boolean)
    onChange(ids, labels)
  }

  const expandTo = (id: string) => {
    const path: string[] = []
    let cur: string|undefined = id
    while (cur) { path.unshift(cur); cur = parentById[cur] }
    setExpanded(prev => { const next = { ...prev }; path.forEach(p => { if (p !== id) next[p] = true }); return next })
    setTimeout(()=> { const el = rowRefs.current[id]; if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'center' }) }, 50)
  }

  const findNodeById = (nodes: Category[]|undefined, id: string): Category|undefined => {
    for (const n of nodes || []) { if (n.id === id) return n; const hit = findNodeById(n.children, id); if (hit) return hit }
    return undefined
  }
  const getRootFor = (id: string): Category|undefined => {
    let cur: string|undefined = id
    let root = id
    while (parentById[cur || '']) { root = parentById[cur || ''] as string; cur = parentById[cur || ''] }
    return findNodeById(tree, root)
  }

  const askDelete = (id: string, name: string) => setConfirm({ open:true, id, name })
  const doDelete = async () => { if (!confirm.id) return; await categoriesService.remove(confirm.id); await qc.invalidateQueries({ queryKey:['categories'] }); setConfirm({ open:false }); toast.success('Category deleted') }

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
        <Button startContent={<PlusIcon className="w-4 h-4" />} onPress={()=> { setEditCat(undefined); setModal(true) }}>{'Add new category'}</Button>
      </div>

      <div className="divide-y divide-default-200 max-h-96 overflow-auto">
        {rows.map(r => (
          <div key={r.id} ref={el=> rowRefs.current[r.id] = el} className="flex items-center gap-2 px-3 py-2">
            <div style={{ paddingLeft: r.depth * 20 }} className="flex items-center gap-2 flex-1">
              {r.hasChildren ? (
                <button className="p-1 rounded hover:bg-default-100" onClick={()=> setExpanded(s => ({ ...s, [r.id]: !s[r.id] }))}>
                  {expanded[r.id] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>
              ) : <span className="w-5" />}
              <Checkbox isSelected={selectedSet.has(r.id)} onValueChange={()=> toggleSelect(r.id)}>{r.name}</Checkbox>
            </div>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Category actions">
                <DropdownItem key="edit" onPress={()=> { const rootCat = getRootFor(r.id) || r.raw; setEditCat({ ...rootCat }); setFocusId(r.id); expandTo(r.id); setModal(true) }}>Edit</DropdownItem>
                <DropdownItem key="delete" color="danger" onPress={()=> askDelete(r.id, r.name)}>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        ))}
      </div>

      <CategoryModal
        isOpen={modal}
        mode={editCat ? 'edit' : 'create'}
        category={editCat}
        focusId={focusId}
        onClose={()=> { setModal(false); setEditCat(undefined) }}
        onSuccess={()=> { setModal(false); setEditCat(undefined); qc.invalidateQueries({ queryKey:['categories'] }) }}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={'Delete category?'}
        description={`This will delete ${confirm.name} and all its children.`}
        confirmText={'Delete'}
        confirmColor="danger"
        onConfirm={doDelete}
        onClose={()=> setConfirm({ open:false })}
      />
    </div>
  )
} 