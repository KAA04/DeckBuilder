import axios from 'axios'

import { supabase } from './supabase'

let accessToken: string | null = null
let tokenPromise: Promise<string | null> | null = null

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
})

api.interceptors.request.use(async (config) => {
  if (!accessToken) {
    tokenPromise ??= supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null).finally(() => { tokenPromise = null })
    accessToken = await tokenPromise
  }
  const token = accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token ?? null
})

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (Array.isArray(data?.errors)) {
      const details = data.errors.map((item: { row: number; errors: string[] }) => `Row ${item.row}: ${item.errors.join(', ')}`).join(' | ')
      return `${data.error ?? 'Validation failed.'} ${details}`
    }
    return data?.error ?? data?.message ?? 'Something went wrong.'
  }
  return 'Something went wrong.'
}
