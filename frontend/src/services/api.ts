import axios from 'axios'

import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (Array.isArray(data?.errors)) {
      const details = data.errors.map((item: { row: number; errors: string[] }) => `Row ${item.row}: ${item.errors.join(', ')}`).join(' | ')
      return `${data.error ?? 'Validation failed.'} ${details}`
    }
    return data?.error ?? 'Something went wrong.'
  }
  return 'Something went wrong.'
}
