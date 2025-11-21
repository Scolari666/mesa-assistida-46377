import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    supabase.realtime.onOpen(() => setIsSupabaseConnected(true))
    supabase.realtime.onClose(() => setIsSupabaseConnected(false))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) {
    return (
      <div className="connection-status offline">
        🔴 Offline - Verifique sua conexão
      </div>
    )
  }

  if (!isSupabaseConnected) {
    return (
      <div className="connection-status connecting">
        🟡 Conectando ao servidor...
      </div>
    )
  }

  return (
    <div className="connection-status online">
      🟢 Conectado - Chamadas em tempo real ativas
    </div>
  )
}
