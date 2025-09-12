import { ReactNode } from 'react'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  onSubmit?: () => void
  submitLabel?: string
  isSubmitting?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
  submitDisabled?: boolean
}

export default function CustomModal({ isOpen, onOpenChange, title, children, onSubmit, submitLabel = 'Save', isSubmitting, size = 'lg', submitDisabled }: Props) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={size} backdrop="blur" classNames={{ wrapper: 'z-[1100]' }}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-base">{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => close()} className="h-11">Cancel</Button>
              {onSubmit && (
                <Button color="primary" onPress={onSubmit} isLoading={isSubmitting} isDisabled={submitDisabled} className="h-11">{submitLabel}</Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
} 