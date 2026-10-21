import { roles, userStatuses, type AdminStats, type UserList } from '@tapbusiness/shared'
import { ChevronLeft, ChevronRight, Clock, Eye, Nfc, Plus, Search, UserCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Select, inputClass } from '../../components/editor/fields'
import { Alert, Spinner } from '../../components/ui'
import { errorMessage, useFormatters, useI18n } from '../../i18n'
import { adminApi } from '../../lib/api'
import { StatusBadge } from './shared'

const PAGE_SIZE = 20

export function AdminUsersPage() {
  const { t } = useI18n()
  const fmt = useFormatters()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const role = params.get('role') ?? ''
  const page = Number(params.get('page') ?? 1) || 1

  const [search, setSearch] = useState(q)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [list, setList] = useState<UserList | null>(null)
  const [error, setError] = useState<unknown>(null)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  useEffect(() => {
    adminApi.stats().then(setStats, () => {})
  }, [])

  // debounce typing into the search box
  useEffect(() => {
    const timer = setTimeout(() => search !== q && setParam('q', search), 300)
    return () => clearTimeout(timer)
  }, [search]) // only the typed text should restart the debounce

  useEffect(() => {
    let cancelled = false
    setError(null)
    adminApi.users({ q, status, role, page, pageSize: PAGE_SIZE }).then(
      (r) => !cancelled && setList(r),
      (e) => !cancelled && setError(e),
    )
    return () => {
      cancelled = true
    }
  }, [q, status, role, page])

  const tiles = stats && [
    { icon: Users, label: t('admin.stats.customers'), value: stats.customers },
    { icon: UserCheck, label: t('admin.stats.active'), value: stats.users.active },
    { icon: Clock, label: t('admin.stats.pending'), value: stats.users.pending },
    { icon: Eye, label: t('admin.stats.views30'), value: stats.last30Days.view },
    { icon: Nfc, label: t('admin.stats.taps30'), value: stats.last30Days.tap },
  ]
  const from = list && list.total ? (list.page - 1) * list.pageSize + 1 : 0
  const to = list ? Math.min(list.total, list.page * list.pageSize) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles
          ? tiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Icon size={14} /> {label}
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{fmt.number(value)}</div>
              </div>
            ))
          : Array.from({ length: 5 }, (_, i) => <div key={i} className="h-[76px] animate-pulse rounded-xl bg-slate-200/60" />)}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <h1 className="mr-auto text-lg font-semibold text-slate-900">{t('admin.users.title')}</h1>
          <Link
            to="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} /> {t('admin.users.new')}
          </Link>
          <div className="flex w-full flex-wrap gap-2">
            <label className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.users.search')}
                aria-label={t('admin.users.search')}
                className={`${inputClass} pl-9`}
              />
            </label>
            <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="!w-auto">
              <option value="">{t('admin.users.allStatuses')}</option>
              {userStatuses.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Select>
            <Select value={role} onChange={(e) => setParam('role', e.target.value)} className="!w-auto">
              <option value="">{t('admin.users.allRoles')}</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error ? (
          <div className="p-4">
            <Alert kind="error">{errorMessage(t, error)}</Alert>
          </div>
        ) : !list ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : list.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">{t('admin.users.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">{t('admin.col.name')}</th>
                  <th className="px-4 py-2.5">{t('admin.col.profile')}</th>
                  <th className="px-4 py-2.5">{t('admin.col.card')}</th>
                  <th className="px-4 py-2.5">{t('admin.col.status')}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{t('admin.col.lastLogin')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/admin/users/${u.id}`} className="font-medium text-slate-900 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {u.name}
                      </Link>
                      {u.role === 'admin' && (
                        <span className="ml-2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">{t('role.admin')}</span>
                      )}
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.username ? `/u/${u.username}` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.cardId ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{fmt.date(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {list && list.total > list.pageSize && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>{t('admin.pagination', { from, to, total: list.total })}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> {t('admin.prev')}
              </button>
              <button
                disabled={to >= list.total}
                onClick={() => setParam('page', String(page + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                {t('admin.next')} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
