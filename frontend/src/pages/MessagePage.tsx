import { Link, useParams } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'

export function MessagePage({ title, text }: { title: string; text: string }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="max-w-md text-slate-600">{text}</p>
      <Link to="/" className="mt-2 font-semibold text-blue-600 hover:underline">
        {t('common.backHome')}
      </Link>
      <LanguageSwitcher className="mt-6" />
    </div>
  )
}

export function NotFoundPage() {
  const { t } = useI18n()
  return <MessagePage title={t('notFound.title')} text={t('notFound.text')} />
}

/** Where /c/:cardId sends taps of a card that isn't linked to any profile. */
export function CardUnregisteredPage() {
  const { t } = useI18n()
  const { cardId = '' } = useParams()
  return <MessagePage title={t('card.unregistered.title')} text={t('card.unregistered.text', { cardId })} />
}
