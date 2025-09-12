import { useMemo, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import CustomModal from '../../../components/common/CustomModal'
import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react'
import { TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'

export default function StageOrderModal({ isOpen, onOpenChange, stages, onApply, onDelete }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; stages: any[]; onApply: (keys:string[])=>void; onDelete: (key:string)=>void }) {
  const [local, setLocal] = useState<string[]>(stages.map((s:any)=>s.key))
  useMemo(()=> setLocal(stages.map((s:any)=>s.key)), [stages])

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    const arr = Array.from(local)
    const [moved] = arr.splice(result.source.index, 1)
    arr.splice(result.destination.index, 0, moved)
    setLocal(arr)
  }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title="Reorder Stages" onSubmit={() => { onApply(local); onOpenChange(false) }} submitLabel="Apply">
      <div className="max-h-[60vh] overflow-y-auto p-2">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="stages-order" direction="vertical">
            {(prov:any) => (
              <div ref={prov.innerRef} {...prov.droppableProps}>
                {local.map((k, idx) => (
                  <Draggable key={k} draggableId={k} index={idx}>
                    {(p:any, snapshot:any) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        style={{ ...(p.draggableProps.style || {}), marginBottom: 8 }}
                        className={`p-2 border rounded bg-white flex items-center justify-between ${snapshot.isDragging ? 'z-50 shadow-md pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span {...p.dragHandleProps} className="text-default-400 cursor-grab"><Bars3Icon className="w-5 h-5" /></span>
                          <span className="text-sm">{stages.find((s:any)=>s.key===k)?.title || k}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-default-400">#{idx+1}</span>
                          <Popover placement="left">
                            <PopoverTrigger>
                              <button className="p-1 text-danger hover:text-danger-600" aria-label="delete stage"><TrashIcon className="w-4 h-4" /></button>
                            </PopoverTrigger>
                            <PopoverContent className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Delete?</span>
                                <Button size="sm" variant="flat">Cancel</Button>
                                <Button size="sm" color="danger" onPress={()=> onDelete(k)}>Delete</Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {prov.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </CustomModal>
  )
} 