import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cloud sync is optional — the app still runs local-only (see store.js)
// if these aren't set, e.g. when someone forks the repo without Supabase.
export const cloudEnabled = Boolean(url && anonKey)

export const supabase = cloudEnabled ? createClient(url, anonKey) : null
