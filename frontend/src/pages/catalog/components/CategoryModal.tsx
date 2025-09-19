import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Button, Switch, Select, SelectItem } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

 type Props = {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  category?: Category
  focusId?: string
  onClose: () => void
  onSuccess: () => void
 }

 type SubNode = { id?: string; name: string; children: SubNode[] }

function NodeEditor({ node, level, onChange, onRemove, focusId }: { node: SubNode; level: number; onChange: (n: SubNode)=>void; onRemove?: ()=>void; focusId?: string }) {
  const inputRef = useRef<HTMLInputElement|null>(null)
  useEffect(()=> { if (focusId && node.id && node.id === focusId && inputRef.current) { inputRef.current.focus() } }, [focusId, node.id])
  const addChild = () => onChange({ ...node, children: [...node.children, { name: '', children: [] }] })
  const updateChild = (idx: number, patch: SubNode) => { const next = node.children.slice(); next[idx] = patch; onChange({ ...node, children: next }) }
  const removeChild = (idx: number) => { const next = node.children.slice(); next.splice(idx,1); onChange({ ...node, children: next }) }
  return (
    <div className={`space-y-3 ${level ? 'relative pl-6' : ''}`}>
      {level ? (<><div className="absolute left-2 top-4 bottom-0 border-l border-default-300/60" /><div className="absolute left-2 top-6 w-4 -ml-px border-t border-default-300/60" /></>) : null}
      <div className="flex items-center gap-2">
        <Input placeholder={level === 0 ? 'Enter category name' : 'Enter subcategory name'} variant="bordered" classNames={{ inputWrapper: 'h-12' }} value={node.name} onValueChange={(v)=> onChange({ ...node, name: v })} isReadOnly={false} ref={inputRef as any} />
        {onRemove ? (<Button isIconOnly variant="light" color="danger" aria-label="remove" onPress={onRemove}><XMarkIcon className="w-5 h-5" /></Button>) : null}
      </div>
      {node.children.length > 0 && (<div className="space-y-3">{node.children.map((child, idx) => (<NodeEditor key={idx} node={child} level={level+1} onChange={(n)=> updateChild(idx, n)} onRemove={()=> removeChild(idx)} focusId={focusId} />))}</div>)}
      <div className={`${level ? 'pl-6' : ''}`}>
        <Button variant="light" startContent={<PlusIcon className="w-4 h-4" />} onPress={addChild}>Add subcategory</Button>
      </div>
    </div>
  )
}

export default function CategoryModal({ isOpen, mode, category, focusId, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [root, setRoot] = useState<SubNode>({ name: '', children: [] })
  const [isActive, setIsActive] = useState(true)
  const treeQ = useQuery({ queryKey:['categories','tree'], queryFn: categoriesService.getTree, enabled: isOpen })
  const [parentId, setParentId] = useState<string>('')

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!root.name.trim()) throw new Error('Category name is required')
      const createTree = async (node: SubNode, parentId?: string): Promise<string> => {
        const created = await categoriesService.create({ name: node.name.trim(), parent_id: parentId })
        const id = created.id
        for (const ch of node.children) { if (ch.name.trim()) { await createTree(ch, id) } }
        return id
      }
      if (mode === 'create') {
        await createTree(root)
      } else if (mode === 'edit' && category) {
        // 1) Update the root category itself
        await categoriesService.update(category.id, { name: root.name.trim(), is_active: isActive, parent_id: parentId || '' })
        // 2) Load current subtree to know existing children
        const fullTree = treeQ.data || []
        const findSubtree = (nodes: Category[], id: string): Category | null => {
          for (const n of nodes || []) { if (n.id === id) return n; const hit = findSubtree(n.children || [], id); if (hit) return hit }
          return null
        }
        const current = findSubtree(fullTree, category.id)
        const currentChildren = current?.children || []
        const currentById = new Map(currentChildren.map(ch => [ch.id, ch]))
        const newById = new Map((root.children||[]).filter(n=>!!n.id).map(n => [String(n.id), n]))
        // 3) Delete children that are removed
        for (const old of currentChildren) { if (!newById.has(old.id)) { await categoriesService.remove(old.id) } }
        // 4) Upsert children
        const upsert = async (node: SubNode, parent: string) => {
          if (node.id) {
            // update existing
            await categoriesService.update(node.id, { name: node.name.trim(), parent_id: parent })
            const old = currentById.get(node.id) || null
            const oldChildren = old?.children || []
            const oldById = new Map(oldChildren.map(ch => [ch.id, ch]))
            const newChildById = new Map((node.children||[]).filter(n=>!!n.id).map(n => [String(n.id), n]))
            // delete removed grandchildren
            for (const oc of oldChildren) { if (!newChildById.has(oc.id)) { await categoriesService.remove(oc.id) } }
            // recurse
            for (const ch of node.children) { await upsert(ch, node.id) }
          } else {
            const createdId = await createTree({ name: node.name, children: node.children }, parent)
            return createdId
          }
        }
        for (const child of root.children) { if (child.name.trim()) await upsert(child, category.id) }
      }
    },
    onSuccess: () => { toast.success(mode === 'create' ? t('catalog.toast.created', { entity: t('catalog.entities.category') }) : t('catalog.toast.updated', { entity: t('catalog.entities.category') })); onSuccess(); if (mode === 'create') setRoot({ name: '', children: [] }) },
    onError: (error: any) => { toast.error(error?.response?.data?.message || 'Failed to save category') }
  })

  useEffect(() => {
    if (isOpen && mode !== 'create' && category) {
      const findSubtree = (nodes: Category[], id: string): Category | null => {
        for (const n of nodes || []) { if (n.id === id) return n; const hit = findSubtree(n.children || [], id); if (hit) return hit }
        return null
      }
      // category here is expected to be a ROOT node of the chain we want to edit
      const target = findSubtree(treeQ.data || [], category.id)
      if (target) {
        const toNode = (n: Category): SubNode => ({ id: n.id, name: n.name, children: (n.children || []).map(toNode) })
        setRoot(toNode(target))
        setIsActive(target.is_active)
        setParentId(target.parent_id || '')
      }
    } else if (isOpen && mode === 'create') {
      setRoot({ name: '', children: [] })
      setIsActive(true)
      setParentId('')
    }
  }, [isOpen, mode, category, treeQ.data])

  const isReadOnly = mode === 'view'

  const parentOptions = (treeQ.data || []).map((n)=> ({ id: n.id, name: n.name }))

  return (
    <CustomModal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }} title={mode === 'create' ? t('catalog.create.category') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.category') : t('common.view') + ' ' + t('catalog.entities.category')} onSubmit={isReadOnly ? undefined : () => createMutation.mutate()} submitLabel={mode === 'create' ? t('common.create') : t('common.update')} isSubmitting={createMutation.isPending} size="3xl">
      <div className="space-y-4">
        <NodeEditor node={root} level={0} onChange={setRoot} focusId={focusId} />
        {mode === 'edit' && (
          <div className="grid grid-cols-2 gap-4">
            <Switch isSelected={isActive} onValueChange={setIsActive} isDisabled={isReadOnly}>{t('catalog.common.active')}</Switch>
            <Select label={t('catalog.common.parent','Parent')} selectedKeys={parentId? [parentId]: []} onSelectionChange={(keys)=> setParentId(Array.from(keys)[0] as string || '')} isDisabled={isReadOnly}>
              <SelectItem key="">{t('catalog.common.no_parent','No parent')}</SelectItem>
              {(treeQ.data || []).filter(n => n.id !== category?.id).map(n => (<SelectItem key={n.id}>{n.name}</SelectItem>))}
            </Select>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 