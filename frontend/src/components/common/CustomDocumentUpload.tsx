import { useState, useRef } from 'react'
import { Button, Input } from '@heroui/react'
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { uploadService } from '../../services/uploadService'

type Props = {
  label?: string
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  value: string[]
  onChange: (files: string[]) => void
  isReadOnly?: boolean
  className?: string
}

export default function CustomDocumentUpload({
  label = 'Upload Files',
  accept = 'image/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
  value,
  onChange,
  isReadOnly = false,
  className = 'w-full',
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')

  const handleAddUrl = () => {
    const u = url.trim()
    if (!u) return
    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(u) || u.startsWith('http')
    if (!isImg) { toast.error('Enter a valid image URL'); return }
    if (value.length + 1 > maxFiles) { toast.error(`Maximum ${maxFiles} files allowed`); return }
    onChange([...value, u])
    setUrl('')
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Check file count limit
    if (value.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Check file size limit
    const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be smaller than ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      // Upload files to backend
      const uploadedUrls = await uploadService.uploadImages(fileArray)
      onChange([...value, ...uploadedUrls])
      toast.success(`${fileArray.length} file(s) uploaded successfully`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }



  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (isReadOnly) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input value to allow selecting same file again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }

  const openFileDialog = () => {
    if (isReadOnly) return
    fileInputRef.current?.click()
  }

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('/uploads/')
  }

  const normalizeUploadUrl = (raw: string): string => {
    if (!raw) return raw
    const u = raw.trim()
    // Fix protocol-relative
    if (u.startsWith('//uploads/')) return u.replace(/^\/\//, '/') // -> '/uploads/...'
    // Fix explicit wrong host 'uploads'
    const m = u.match(/^https?:\/\/uploads\/(.*)$/i)
    if (m) {
      return `/uploads/${m[1]}`
    }
    // Fix path without leading slash
    if (u.startsWith('uploads/')) return `/${u}`
    return u
  }

  const getFileName = (url: string, index: number) => {
    return url.split('/').pop() || `file-${index + 1}`
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      {/* URL add row */}
      <div className="flex items-center gap-2 mb-3">
        <Input placeholder="https://...image.jpg" value={url} onValueChange={setUrl} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isReadOnly} />
        <Button color="primary" variant="flat" className="h-12 px-6 min-w-[96px]" onPress={handleAddUrl} isDisabled={isReadOnly || !url.trim()}>Add</Button>
      </div>
      <div
        className={`w-full border rounded-lg bg-background ${isDragging ? 'ring-2 ring-primary/40' : 'shadow-sm'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col md:flex-row items-center p-6 space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex-shrink-0">
            <CloudArrowUpIcon className="w-12 h-12 text-default-400" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="text-lg font-semibold mb-1">{uploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
            <p className="text-sm text-default-500">{accept === 'image/*' ? 'Images' : 'Files'} up to {maxSize}MB each{multiple ? ` (max ${maxFiles} files)` : ''}</p>
          </div>

          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={openFileDialog}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:opacity-95"
            >
              Choose Files
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {value.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 items-start">
            {value.map((raw, index) => {
              const normalized = normalizeUploadUrl(raw)
              return (
                <div key={index} className="relative inline-flex items-start group">
                  <div className="w-28 h-28 bg-default-100 rounded-md overflow-hidden flex items-center justify-center">
                    {isImage(normalized) ? (
                      <img src={normalized} alt={`upload-${index}`} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='/assets/images/logo.jpg'}} />
                    ) : (
                      <DocumentIcon className="w-8 h-8 text-default-400" />
                    )}
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow transition-opacity"
                      aria-label={`Remove file ${index + 1}`}
                    >
                      <XMarkIcon className="w-4 h-4 text-danger" />
                    </button>
                  )}
                </div>
              )})}
          </div>
        </div>
      )}
    </div>
  )
} 