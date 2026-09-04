'use client'

import { useState, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import type { Material } from '@/types/database'
import { formatFileSize, getFileTypeLabel, SUPPORTED_EXTENSIONS, MAX_FILE_SIZE, resolveMimeType, isValidFileType } from '@/types/material'

interface MaterialsClientProps {
  initialMaterials: Material[]
}

export default function MaterialsClient({ initialMaterials }: MaterialsClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)
  const [renameTarget, setRenameTarget] = useState<Material | null>(null)
  const [renameName, setRenameName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const pollMaterialStatus = useCallback((materialId: string) => {
    if (pollTimersRef.current.has(materialId)) return

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/materials/${materialId}`)
        if (!res.ok) return

        const { material } = await res.json() as { material: Material }
        setMaterials((prev) =>
          prev.map((m) => (m.id === materialId ? material : m))
        )

        if (material.processing_status === 'completed' || material.processing_status === 'failed') {
          clearInterval(timer)
          pollTimersRef.current.delete(materialId)

          if (material.processing_status === 'completed') {
            toast.success(`"${material.original_filename}" is ready to use!`)
          } else {
            toast.error(`Failed to process "${material.original_filename}". Please try re-uploading.`)
          }
        }
      } catch {
        // Silent fail — will retry on next interval
      }
    }, 3000)

    pollTimersRef.current.set(materialId, timer)
  }, [])

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large. Maximum size is 50MB.`)
        continue
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        toast.error(`"${file.name}" is not a supported file type. Use PDF, DOCX, PPTX, or TXT.`)
        continue
      }

      // Resolve correct MIME type — browsers sometimes report empty string for PDF/PPTX
      const resolvedMime = resolveMimeType(file.name, file.type)
      if (!isValidFileType(resolvedMime)) {
        toast.error(`"${file.name}" has an unrecognised file type.`)
        continue
      }

      // If browser reported wrong/empty MIME, create a corrected File object
      const uploadFile = resolvedMime !== file.type
        ? new File([file], file.name, { type: resolvedMime })
        : file

      setUploading(true)
      setUploadProgress(10)

      // Simulate progress while waiting (processing is synchronous server-side)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90))
      }, 800)

      try {
        const formData = new FormData()
        formData.append('file', uploadFile)

        const res = await fetch('/api/materials', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const data = await res.json() as { material?: Material; error?: string }

        if (!res.ok) {
          toast.error(data.error ?? 'Upload failed. Please try again.')
        } else if (data.material) {
          setMaterials((prev) => [data.material!, ...prev])
          if (data.material.processing_status === 'completed') {
            toast.success(`"${file.name}" uploaded and ready!`)
          } else if (data.material.processing_status === 'failed') {
            toast.error(`"${file.name}" uploaded but processing failed. Please try again.`)
          } else {
            toast.info(`"${file.name}" uploaded. Processing...`)
            pollMaterialStatus(data.material.id)
          }
        }
      } catch {
        clearInterval(progressInterval)
        toast.error('Upload failed. Please check your connection and try again.')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/materials/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json() as { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete material.')
        return
      }

      setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.original_filename}" deleted.`)
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete material. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameName.trim()) return
    setIsRenaming(true)
    try {
      const res = await fetch(`/api/materials/${renameTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_filename: renameName.trim() }),
      })
      const data = await res.json() as { material?: Material; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to rename material.')
        return
      }

      if (data.material) {
        setMaterials((prev) => prev.map((m) => (m.id === renameTarget.id ? data.material! : m)))
        toast.success('Material renamed.')
        setRenameTarget(null)
      }
    } catch {
      toast.error('Failed to rename material. Please try again.')
    } finally {
      setIsRenaming(false)
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Materials</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your learning materials
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Plus className="w-4 h-4 mr-1.5" />
          Upload
        </Button>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload material"
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="text-sm font-medium">Uploading and processing your file...</p>
            <p className="text-xs text-muted-foreground">This may take 15–30 seconds</p>
            <Progress value={uploadProgress} className="max-w-xs mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports PDF, DOCX, PPTX, TXT — max 50MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Processing may take 15–30 seconds depending on file size
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
        aria-label="File input"
      />

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No learning materials yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Upload your first PDF, DOCX, PPTX, or TXT file to get started.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1.5" />
              Upload Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onDelete={() => setDeleteTarget(material)}
              onRename={() => {
                setRenameTarget(material)
                setRenameName(material.original_filename)
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this material?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.original_filename}&quot; and all its
              processed data. This may affect quizzes that use this material.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename material</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Material name"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={isRenaming}>
              {isRenaming && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MaterialCard({
  material,
  onDelete,
  onRename,
}: {
  material: Material
  onDelete: () => void
  onRename: () => void
}) {
  const statusConfig = {
    uploading: { icon: Loader2, label: 'Uploading', color: 'text-blue-500', spin: true },
    processing: { icon: RefreshCw, label: 'Processing', color: 'text-amber-500', spin: true },
    completed: { icon: CheckCircle2, label: 'Ready', color: 'text-green-600', spin: false },
    failed: { icon: XCircle, label: 'Failed', color: 'text-destructive', spin: false },
  }

  const status = statusConfig[material.processing_status as keyof typeof statusConfig]
  const StatusIcon = status?.icon ?? Clock

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{material.original_filename}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getFileTypeLabel(material.file_type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(material.file_size)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(material.uploaded_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 shrink-0 ${status?.color}`}>
            <StatusIcon className={`w-4 h-4 ${status?.spin ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium hidden sm:block">{status?.label}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {material.processing_status === 'completed' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quiz/create?materialId=${material.id}`}>
                  Create Quiz
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRename}
              aria-label={`Rename ${material.original_filename}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label={`Delete ${material.original_filename}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
