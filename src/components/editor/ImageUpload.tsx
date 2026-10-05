import { ImagePlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { fileToDataUrl } from '../../lib/image'

export function ImageUpload({
  onUpload,
  children,
  maxSize,
  multiple = false,
  className = '',
}: {
  onUpload: (dataUrls: string[]) => void
  children?: ReactNode
  maxSize?: number
  multiple?: boolean
  className?: string
}) {
  const [busy, setBusy] = useState(false)

  return (
    <label className={`cursor-pointer ${className}`}>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            onUpload(await Promise.all(files.map((f) => fileToDataUrl(f, maxSize))))
          } catch {
            alert('Gagal memproses gambar. Coba file lain.')
          } finally {
            setBusy(false)
          }
        }}
      />
      {children ?? (
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ImagePlus size={16} /> {busy ? 'Memproses…' : 'Unggah gambar'}
        </span>
      )}
    </label>
  )
}
