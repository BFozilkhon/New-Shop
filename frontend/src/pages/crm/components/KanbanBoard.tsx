import { useMemo, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import ConfirmModal from '../../../components/common/ConfirmModal'
import CreateLeadModal from './CreateLeadModal'
import StageOrderModal from './StageOrderModal'
import LeadDrawer from './LeadDrawer'
import { useQueryClient } from '@tanstack/react-query'
import { leadsService } from '../../../services/leadsService'
import { 
  CalendarIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

function CreateStageModal({ isOpen, onOpenChange, onCreate }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; onCreate: (payload:{ key:string; title:string })=>void }) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const handle = () => { onCreate({ key, title }); onOpenChange(false); setKey(''); setTitle('') }
  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title="Create Stage" onSubmit={handle} submitLabel="Create">
      <div className="space-y-4">
        <Input label="Key (slug)" value={key} onValueChange={setKey} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        <Input label="Title" value={title} onValueChange={setTitle} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
      </div>
    </CustomModal>
  )
}

// StageOrderModal moved to its own file

const stageColorClasses: string[] = [
  'bg-blue-50 text-blue-700',
  'bg-green-50 text-green-700',
  'bg-amber-50 text-amber-700',
  'bg-purple-50 text-purple-700',
  'bg-pink-50 text-pink-700',
  'bg-indigo-50 text-indigo-700',
  'bg-slate-50 text-slate-700',
]

function getPriorityBadge(priority?: string) {
  switch (priority) {
    case 'high':
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
    case 'medium':
      return <ClockIcon className="w-4 h-4 text-amber-600" />
    case 'low':
      return <CheckCircleIcon className="w-4 h-4 text-green-600" />
    default:
      return null
  }
}

export default function KanbanBoard({ stages = [], leads = [], onDragEnd, onCreateLead, onEditLead, onDeleteLead }: { stages?: any[]; leads?: any[]; onDragEnd?: (result:any)=>void; onCreateLead?: (payload:any)=>void; onEditLead?: (lead:any)=>void; onDeleteLead?: (id:string)=>void }) {
  const qc = useQueryClient()
  const sortedStages = (stages || []).slice().sort((a:any,b:any) => (a.order||0) - (b.order||0))

  // Local board state for smooth DnD
  const [board, setBoard] = useState<Record<string, any[]>>({})
  useEffect(() => {
    const byStage: Record<string, any[]> = {}
    sortedStages.forEach((s:any) => { byStage[s.key] = [] })
    ;(leads || []).forEach((l:any) => {
      const key = l.stage || l.status
      if (!byStage[key]) byStage[key] = []
      byStage[key].push(l)
    })
    setBoard(byStage)
  }, [JSON.stringify(leads), JSON.stringify(sortedStages.map((s:any)=>s.key))])

  const [openCreate, setOpenCreate] = useState(false)
  const [createStage, setCreateStage] = useState<string | undefined>(undefined)
  const [openCreateStage, setOpenCreateStage] = useState(false)
  const [openOrderStage, setOpenOrderStage] = useState(false)
  const [editLead, setEditLead] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [drawerLead, setDrawerLead] = useState<any | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const filteredBoard = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return board
    const result: Record<string, any[]> = {}
    Object.keys(board).forEach(k => {
      result[k] = (board[k] || []).filter((l:any) => (l.title||'').toLowerCase().includes(q))
    })
    return result
  }, [board, searchQuery])

  const handleCreate = async (payload: any) => {
    if (onCreateLead) return onCreateLead(payload)
    try {
      const status = payload.status || createStage || sortedStages[0]?.key || 'new'
      await leadsService.create({ ...payload, status, stage: status })
      qc.invalidateQueries({ queryKey: ['leads'] })
    } catch (e) { console.error(e) }
  }

  const handleEdit = async (payload: any) => {
    if (!editLead) return
    try {
      await leadsService.update(editLead.id, payload)
      setEditLead(null)
      qc.invalidateQueries({ queryKey: ['leads'] })
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    try {
      await leadsService.bulkUpdate({ ids: [id], update: { is_deleted: true } })
      qc.invalidateQueries({ queryKey: ['leads'] })
    } catch (e) { console.error(e) }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return
    const { source, destination, draggableId } = result
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    // optimistic move in local board
    setBoard(prev => {
      const next = { ...prev }
      const fromArr = Array.from(next[source.droppableId] || [])
      const [moved] = fromArr.splice(source.index, 1)
      next[source.droppableId] = fromArr
      const toArr = Array.from(next[destination.droppableId] || [])
      toArr.splice(destination.index, 0, moved)
      next[destination.droppableId] = toArr
      return next
    })

    try {
      await leadsService.updateStatus(draggableId, destination.droppableId)
      qc.invalidateQueries({ queryKey: ['leads'] })
      if (onDragEnd) onDragEnd(result)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4 overflow-x-auto" style={{ maxWidth: 'calc(100vw - var(--sidebar-width, 264px) - 48px)' }}>
      <div className="py-3 px-1">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-full sm:max-w-[44%]"
            classNames={{ inputWrapper: 'h-11 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-lg', input: 'text-foreground' }}
            placeholder="Search leads..."
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-500" />}
            size="md"
          />
          <div className="flex gap-3">
            <Button color="default" variant="bordered" onPress={() => setOpenCreateStage(true)}>Create Stage</Button>
            <Button color="default" variant="bordered" onPress={() => setOpenOrderStage(true)}>Reorder Stages</Button>
            <Button color="primary" startContent={<PlusIcon className="h-5 w-5" />} onPress={() => { setCreateStage(sortedStages[0]?.key); setOpenCreate(true) }}>Create Lead</Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2 w-full overflow-y-hidden">
          {sortedStages.map((s: any, idx: number) => {
            const items = filteredBoard[s.key] || []
            const total = items.reduce((sum:number, it:any) => sum + (Number(it.amount||it.value||0)||0), 0)
            const color = stageColorClasses[idx % stageColorClasses.length]
            return (
              <div key={s._id || s.key} className="min-w-[320px] flex-shrink-0 rounded-xl border p-3 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium ${color}`}>{s.title || s.name || s.key}</span>
                    <span className="text-sm text-default-500">({items.length})</span>
                  </div>
                  <button className="p-1 text-default-500 hover:text-default-700" onClick={() => { setCreateStage(s.key); setOpenCreate(true) }}>
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="text-sm text-default-700 font-semibold flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                    {total.toLocaleString()}
                  </div>
                </div>
                <Droppable droppableId={String(s.key)} direction="vertical">
                  {(provided: any, snapshot: any) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[120px] max-h-[calc(100vh-22rem)] overflow-y-auto p-2 transition-colors rounded-md ${snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-content2'}`}>
                      {items.map((l:any, idx:number) => {
                        const id = String(l.id || l._id || l._id?.$oid || idx)
                        const borderClass = l.priority === 'high' ? 'border-l-red-500' : l.priority === 'medium' ? 'border-l-amber-500' : 'border-l-green-500'
                        return (
                          <Draggable key={id} draggableId={id} index={idx}>
                            {(prov: any, snap: any) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} onClick={() => { if (!snap.isDragging) setDrawerLead(l) }} style={{ ...(prov.draggableProps.style || {}), marginBottom: 8 }} className={`p-3 border rounded-lg bg-background shadow-sm ${borderClass} border-l-4 ${snap.isDragging ? 'z-50 pointer-events-none ring-1 ring-primary/30' : 'cursor-pointer'}`}>
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="text-sm font-medium text-default-900 line-clamp-1 pr-2">{l.title}</h4>
                                  <Dropdown>
                                    <DropdownTrigger>
                                      <button className="p-0.5 text-default-400 hover:text-default-600" onClick={(e)=>e.stopPropagation()}>
                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                      </button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="lead-actions" onAction={(key)=>{
                                      if(key==='edit') { if(onEditLead) onEditLead(l); else setEditLead(l) }
                                      if(key==='delete') { if(onDeleteLead) onDeleteLead(id); else setConfirmDelete(id) }
                                    }}>
                                      <DropdownItem key="edit">Edit</DropdownItem>
                                      <DropdownItem key="delete" className="text-danger" color="danger">Delete</DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <UserIcon className="w-3.5 h-3.5 text-default-400 flex-shrink-0" />
                                    <span className="text-default-600 truncate">{l.customer_name || l.company || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                    <div className="flex items-center gap-1">
                                      <CurrencyDollarIcon className="w-3.5 h-3.5 text-default-400" />
                                      <span className="font-medium text-default-900">{Number(l.amount||l.value||0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-3.5 h-3.5 text-default-400" />
                                      <span className="text-default-500">{(l.expected_close_date || l.updated_at || l.created_at || '').slice(0,10) || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )})}
                        {items.length === 0 && (
                          <div className="w-full h-[70px] border-2 border-dashed rounded-lg p-2 text-center flex items-center justify-center text-xs text-default-500">No leads</div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <CreateLeadModal isOpen={openCreate} onOpenChange={setOpenCreate} onCreate={handleCreate} defaultStatus={createStage || sortedStages[0]?.key} />
      <CreateLeadModal isOpen={!!editLead} onOpenChange={(v)=>{ if(!v) setEditLead(null) }} onCreate={handleEdit} defaultStatus={(editLead?.stage||editLead?.status)||createStage||sortedStages[0]?.key} initial={editLead} />
      <ConfirmModal isOpen={!!confirmDelete} title="Delete lead?" description="This action will soft-delete the lead." onConfirm={() => { if(confirmDelete) { handleDelete(confirmDelete); setConfirmDelete(null) } }} onClose={() => setConfirmDelete(null)} />
      <CreateStageModal isOpen={openCreateStage} onOpenChange={setOpenCreateStage} onCreate={async ({ key, title }) => { await leadsService.createStage({ key, title }); qc.invalidateQueries({ queryKey: ['pipeline','stages'] }) }} />
      <StageOrderModal isOpen={openOrderStage} onOpenChange={setOpenOrderStage} stages={stages} onApply={async (keys)=> { await leadsService.reorderStages(keys); qc.invalidateQueries({ queryKey: ['pipeline','stages'] }) }} onDelete={async (key)=> { await leadsService.deleteStage(key); qc.invalidateQueries({ queryKey: ['pipeline','stages'] }) }} />
      <LeadDrawer isOpen={!!drawerLead} onOpenChange={(v)=>{ if(!v) setDrawerLead(null) }} lead={drawerLead} stages={sortedStages} />
    </div>
  )
} 