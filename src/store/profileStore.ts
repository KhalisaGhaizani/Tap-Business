import { useSyncExternalStore } from 'react'
import type { Profile } from '../types'
import { demoProfile } from '../data/demoProfile'

const STORAGE_KEY = 'tapbusiness.profile'

type SaveStatus = 'saved' | 'error'

let profile: Profile = load()
let saveStatus: SaveStatus = 'saved'
const listeners = new Set<() => void>()

function load(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...demoProfile, ...JSON.parse(raw) }
  } catch {
    // fall through to demo data
  }
  return structuredClone(demoProfile)
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    saveStatus = 'saved'
  } catch {
    // usually the storage quota is exceeded by large images
    saveStatus = 'error'
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// keep multiple open tabs (editor + public page) in sync
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    profile = load()
    emit()
  }
})

export function updateProfile(patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) {
  const changes = typeof patch === 'function' ? patch(profile) : patch
  profile = { ...profile, ...changes }
  persist()
  emit()
}

export function resetProfile() {
  profile = structuredClone(demoProfile)
  persist()
  emit()
}

export function useProfile() {
  return useSyncExternalStore(subscribe, () => profile)
}

export function useSaveStatus() {
  return useSyncExternalStore(subscribe, () => saveStatus)
}

export const newId = () => Math.random().toString(36).slice(2, 10)
