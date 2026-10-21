import { eventTypes, type Analytics } from '@tapbusiness/shared'
import { Eye, MousePointerClick, Nfc, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { errorMessage, useFormatters, useI18n } from '../i18n'
import type { AnalyticsDays } from '../lib/api'
import { Alert, Button, Spinner } from './ui'

const tileIcons = { view: Eye, tap: Nfc, click: MousePointerClick, vcard: UserPlus }
const ranges: AnalyticsDays[] = [7, 30, 90]

export function StatsPanel({ load }: { load: (days: AnalyticsDays) => Promise<Analytics> }) {
  const { t } = useI18n()
  const fmt = useFormatters()
  const [days, setDays] = useState<AnalyticsDays>(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    load(days).then(
      (d) => !cancelled && setData(d),
      (e) => !cancelled && setError(e),
    )
    return () => {
      cancelled = true
    }
  }, [days, load, attempt])

  return (
    <div className="flex flex-col gap-5">
      <div role="group" className="inline-flex self-start rounded-lg bg-slate-100 p-0.5 text-sm font-medium">
        {ranges.map((n) => (
          <button
            key={n}
            onClick={() => setDays(n)}
            aria-pressed={days === n}
            className={`rounded-md px-3 py-1.5 ${days === n ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t('stats.range', { n })}
          </button>
        ))}
      </div>

      {error ? (
        <Alert kind="error">
          {errorMessage(t, error)}{' '}
          <Button variant="ghost" className="!px-2 !py-0.5" onClick={() => setAttempt((a) => a + 1)}>
            {t('common.retry')}
          </Button>
        </Alert>
      ) : !data ? (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {eventTypes.map((type) => {
              const Icon = tileIcons[type]
              return (
                <div key={type} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Icon size={14} /> {t(`stats.${type}`)}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{fmt.number(data.totals[type])}</div>
                </div>
              )
            })}
          </div>

          <DailyChart data={data} />

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('stats.topLinks')}</h3>
            {data.topLinks.length ? (
              <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {data.topLinks.map((l) => (
                  <li key={l.target} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-slate-700">{l.target}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{fmt.number(l.count)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">{t('stats.noClicks')}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Views per day as thin bars; hovering a day shows its exact numbers. */
function DailyChart({ data }: { data: Analytics }) {
  const { t, intlLocale } = useI18n()
  const fmt = useFormatters()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.daily.map((d) => d.view))
  // a round top value keeps the gridline labels readable
  const step = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / step) * step
  const label = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })
  const ticks = [0, Math.floor(data.daily.length / 2), data.daily.length - 1]
  const active = hover === null ? null : data.daily[hover]

  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-4">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{t('stats.daily')}</span>
        <span className="text-xs text-slate-500">{t('stats.viewsIncludeTaps')}</span>
      </figcaption>

      <div className="relative mt-3 flex h-44 gap-2">
        <div className="flex flex-col justify-between text-right text-[11px] text-slate-400 tabular-nums">
          <span>{fmt.number(top)}</span>
          <span>{fmt.number(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1" onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((p) => (
            <div key={p} className="absolute inset-x-0 border-t border-slate-100" style={{ top: `${p * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end" style={{ gap: data.daily.length > 40 ? 1 : 2 }} aria-hidden>
            {data.daily.map((d, i) => (
              <div key={d.date} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-blue-700' : 'bg-blue-500'}`}
                  style={{ height: d.view ? `${(d.view / top) * 100}%` : 0, minHeight: d.view ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          {active && hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
              style={{ left: `${((hover + 0.5) / data.daily.length) * 100}%` }}
            >
              <div className="font-semibold">{label(active.date)}</div>
              <div>
                {t('stats.view')}: {fmt.number(active.view)}
              </div>
              <div className="text-slate-300">
                {t('stats.tap')}: {fmt.number(active.tap)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 flex justify-between pl-8 text-[11px] text-slate-400">
        {ticks.map((i) => (
          <span key={i}>{label(data.daily[i].date)}</span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{t('stats.chartLabel')}</caption>
        <tbody>
          {data.daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">{label(d.date)}</th>
              <td>
                {t('stats.view')}: {d.view}
              </td>
              <td>
                {t('stats.tap')}: {d.tap}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
