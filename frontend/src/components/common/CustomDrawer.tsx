import { ReactNode } from 'react'
import { Modal, ModalContent } from '@heroui/react'

export default function CustomDrawer({ isOpen, onOpenChange, title, children, widthClass = 'w-full' }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; title?: ReactNode; children: ReactNode; widthClass?: string }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" backdrop="opaque" hideCloseButton classNames={{ wrapper: 'z-[1200]' }}>
      <ModalContent>
        {(close)=> (
          <div className="flex h-[92vh]">
            <div className={`${widthClass} max-w-full w-full h-full bg-white border-l border-default-200  flex flex-col`}>
              <div className="flex items-center justify-between p-4 border-b border-default-200 bg-white">
                <div className="text-base font-semibold line-clamp-1">{title}</div>
                <button onClick={()=> close()} className="p-2 text-default-400 hover:text-default-600">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                {children}
              </div>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
} 