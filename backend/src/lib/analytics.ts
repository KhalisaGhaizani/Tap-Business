import type { Analytics, EventType } from '@tapbusiness/shared'
import { eventTypes } from '@tapbusiness/shared'
import { sql } from 'drizzle-orm'
import type { Db } from '../db'
import { events } from '../db/schema'

export async function recordEvent(db: Db, profileId: string, type: EventType, target?: string) {
  await db.insert(events).values({ profileId, type, target: target ?? null })
}

const zeroTotals = () => Object.fromEntries(eventTypes.map((t) => [t, 0])) as Record<EventType, number>

/** Daily counts per event type for the last `days` days, bucketed in the business time zone. */
export async function getAnalytics(db: Db, profileId: string, days: number, timeZone: string): Promise<Analytics> {
  const daily = await db.execute<{ date: string } & Record<EventType, string>>(sql`
    with days as (
      select generate_series(
        (now() at time zone ${timeZone})::date - ${days - 1}::int,
        (now() at time zone ${timeZone})::date,
        interval '1 day'
      )::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as date,
      count(e.id) filter (where e.type = 'view') as view,
      count(e.id) filter (where e.type = 'tap') as tap,
      count(e.id) filter (where e.type = 'click') as click,
      count(e.id) filter (where e.type = 'vcard') as vcard
    from days d
    left join events e
      on e.profile_id = ${profileId}
      and e.created_at >= now() - make_interval(days => ${days + 1}::int)
      and (e.created_at at time zone ${timeZone})::date = d.day
    group by d.day
    order by d.day`)

  const topLinks = await db.execute<{ target: string; count: string }>(sql`
    select target, count(*) as count from events
    where profile_id = ${profileId} and type = 'click' and target is not null
      and created_at >= now() - make_interval(days => ${days}::int)
    group by target order by count(*) desc limit 10`)

  const totals = zeroTotals()
  const rows = daily.map((r) => {
    const row = { date: r.date, ...zeroTotals() }
    for (const t of eventTypes) {
      row[t] = Number(r[t])
      totals[t] += row[t]
    }
    return row
  })
  return { days, totals, daily: rows, topLinks: topLinks.map((r) => ({ target: r.target, count: Number(r.count) })) }
}

export async function totalsSince(db: Db, days: number) {
  const rows = await db.execute<{ type: EventType; count: string }>(sql`
    select type, count(*) as count from events
    where created_at >= now() - make_interval(days => ${days}::int) group by type`)
  const totals = zeroTotals()
  for (const r of rows) totals[r.type] = Number(r.count)
  return totals
}
