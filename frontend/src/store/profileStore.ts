import type { Profile } from '@tapbusiness/shared'
import { useSyncExternalStore } from 'react'
import { profileApi } from '../lib/api'

// The profile being edited lives here so every editor panel and the live preview
// share it. Edits apply locally right away and are saved to the API shortly after.

type LoadStatus = 'loading' | 'ready' | 'error'
export type SaveStatus = 'saved' | 'saving' | 'error'

interface State {
  base: string
  loadStatus: LoadStatus
  profile: Profile | null
  saveStatus: SaveStatus
}

const SAVE_DELAY = 700
const RETRY_DELAY = 5000

let state: State = { base: '', loadStatus: 'loading', profile: null, saveStatus: 'saved' }
let dirty = false
let saving = false
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Start editing the profile behind `base` (/api/me or /api/admin/users/:id). */
export async function openProfile(base: string) {
  clearTimeout(timer)
  dirty = false
  set({ base, loadStatus: 'loading', profile: null, saveStatus: 'saved' })
  try {
    const profile = await profileApi(base).get()
    if (state.base === base) set({ profile, loadStatus: 'ready' })
  } catch {
    if (state.base === base) set({ loadStatus: 'error' })
  }
}

function scheduleSave(delay = SAVE_DELAY) {
  dirty = true
  clearTimeout(timer)
  timer = setTimeout(flush, delay)
}

async function flush() {
  if (saving || !dirty || !state.profile) return
  saving = true
  dirty = false
  const base = state.base
  const { username: _u, cardId: _c, ...body } = state.profile
  set({ saveStatus: 'saving' })
  try {
    await profileApi(base).save(body)
    if (state.base === base) set({ saveStatus: dirty ? 'saving' : 'saved' })
  } catch {
    if (state.base === base) {
      set({ saveStatus: 'error' })
      scheduleSave(RETRY_DELAY)
    }
  } finally {
    saving = false
    if (dirty && state.base === base) scheduleSave()
  }
}

export function updateProfile(patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) {
  if (!state.profile) return
  const changes = typeof patch === 'function' ? patch(state.profile) : patch
  set({ profile: { ...state.profile, ...changes } })
  scheduleSave()
}

/** Apply fields the server already saved (e.g. a username change) without re-saving. */
export function applySaved(patch: Partial<Profile>) {
  if (state.profile) set({ profile: { ...state.profile, ...patch } })
}

export const hasUnsavedChanges = () => dirty || saving

export const uploadImage = (file: Blob) => profileApi(state.base).upload(file).then((r) => r.url)

export function useProfileState() {
  return useSyncExternalStore(subscribe, () => state)
}

/** The loaded profile; only use inside components rendered once loading succeeded. */
export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, () => state.profile!)
}

export function useSaveStatus() {
  return useSyncExternalStore(subscribe, () => state.saveStatus)
}

export const newId = () => Math.random().toString(36).slice(2, 10)
