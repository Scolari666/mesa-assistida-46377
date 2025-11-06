import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Call } from '../types/supabase'

export const useRealtimeCalls = () => {
  const { user } = useAuth()
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchCalls = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar chamadas:', error)
      return
    }

    if (data) {
      setCalls(data)
    }
  }, [user])

  const startPolling = useCallback(() => {
    clearPolling()
    pollingRef.current = setInterval(() => {
      fetchCalls().catch((pollError) => {
        console.error('Erro ao realizar polling de chamadas:', pollError)
      })
    }, 5000)
  }, [clearPolling, fetchCalls])

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3')
    audio.play().catch(() => {
      console.log('🔔 Nova chamada recebida!')
    })
  }, [])

  useEffect(() => {
    if (!user) {
      setCalls([])
      setIsLoading(false)
      clearPolling()
      return
    }

    setIsLoading(true)

    const initialize = async () => {
      await fetchCalls()
      setIsLoading(false)
    }

    initialize()

    const channel = supabase
      .channel('calls-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCalls((prev) => [payload.new as Call, ...prev])
          playNotificationSound()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCalls((prev) =>
            prev.map((call) => (call.id === payload.new.id ? (payload.new as Call) : call))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCalls((prev) => prev.filter((call) => call.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      clearPolling()
      supabase.removeChannel(channel)
    }
  }, [user, fetchCalls, clearPolling, startPolling, playNotificationSound])

  useEffect(() => {
    if (!user) {
      clearPolling()
      setUseFallback(false)
      return
    }

    if (calls.length > 0) {
      if (useFallback) {
        setUseFallback(false)
        clearPolling()
      }
      return
    }

    if (useFallback) {
      return
    }

    const timer = setTimeout(() => {
      setUseFallback(true)
      startPolling()
    }, 10000)

    return () => {
      clearTimeout(timer)
    }
  }, [calls.length, clearPolling, startPolling, useFallback, user])

  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])

  return { calls, setCalls, isLoading, useFallback }
}
