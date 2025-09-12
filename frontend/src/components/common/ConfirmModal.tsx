import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'danger',
  onConfirm,
  onClose,
}: {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }} hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              {description ? <p className="text-default-600">{description}</p> : null}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => { close(); onClose() }}>{cancelText}</Button>
              <Button color={confirmColor} onPress={() => { onConfirm(); close(); }}>{confirmText}</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
} 