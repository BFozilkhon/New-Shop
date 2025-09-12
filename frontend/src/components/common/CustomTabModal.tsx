import { ReactNode } from 'react'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tabs, Tab } from '@heroui/react'

type TabDef = { key: string; title: string; content: ReactNode }

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  tabs: TabDef[]
  onSubmit?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

export default function CustomTabModal({ isOpen, onOpenChange, title, tabs, onSubmit, submitLabel = 'Save', isSubmitting }: Props) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl" backdrop="blur" classNames={{ wrapper: 'z-[1100]' }}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-base">{title}</ModalHeader>
            <ModalBody>
              <Tabs disableAnimation aria-label="tabs">
                {tabs.map(t => (
                  <Tab key={t.key} title={t.title}>
                    {t.content}
                  </Tab>
                ))}
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => close()} className="h-11">Cancel</Button>
              {onSubmit && (
                <Button color="primary" onPress={onSubmit} isLoading={isSubmitting} className="h-11">{submitLabel}</Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
} 