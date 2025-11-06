import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not fully configured.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

supabase.realtime.onOpen(() => {
  console.log('✅ WebSocket CONECTADO!')
})

supabase.realtime.onClose(() => {
  console.log('❌ WebSocket FECHADO!')
})

supabase.realtime.onError((error) => {
  console.error('💥 Erro WebSocket:', error)
})
