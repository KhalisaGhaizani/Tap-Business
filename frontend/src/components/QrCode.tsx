import { Download } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Spinner } from './ui'

export function QrCode({ value, fileName, size = 176 }: { value: string; fileName: string; size?: number }) {
  const { t } = useI18n()
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, { width: 1024, margin: 2, errorCorrectionLevel: 'M' }).then((url) => !cancelled && setSrc(url))
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2" style={{ width: size, height: size }}>
        {src ? <img src={src} alt={value} className="h-full w-full" /> : <Spinner />}
      </div>
      {src && (
        <a
          href={src}
          download={`${fileName}.png`}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          <Download size={14} /> {t('share.downloadQr')}
        </a>
      )}
    </div>
  )
}
