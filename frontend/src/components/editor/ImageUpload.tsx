import { ImagePlus, Loader2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { errorMessage, useI18n } from '../../i18n'
import { ApiError } from '../../lib/api'
import { resizeImage } from '../../lib/image'
import { uploadImage } from '../../store/profileStore'

export function ImageUpload({
  onUpload,
  children,
  maxSize,
  multiple = false,
  className = '',
}: {
  onUpload: (urls: string[]) => void
  children?: ReactNode
  maxSize?: number
  multiple?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  return (
    <label className={`cursor-pointer ${busy ? 'pointer-events-none opacity-70' : ''} ${className}`}>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            const urls: string[] = []
            // one at a time keeps memory use low on phones
            for (const file of files) urls.push(await uploadImage(await resizeImage(file, maxSize)))
            onUpload(urls)
          } catch (err) {
            alert(err instanceof ApiError ? errorMessage(t, err) : t('upload.failed'))
          } finally {
            setBusy(false)
          }
        }}
      />
      {children ?? (
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} {busy ? t('upload.busy') : t('upload.button')}
        </span>
      )}
    </label>
  )
}
