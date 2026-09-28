import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/api"
import { supabase } from "@/lib/supabase"

export interface LiveFeedEvent {
  id: string
  type: string
  entityId: string
  payload: unknown
  createdAt: string
}

export type ConnectionMode = "realtime" | "polling" | "disconnected"

export interface UseLiveFeedReturn {
  connectionMode: ConnectionMode
  lastEvent: LiveFeedEvent | null
  error: string | null
  refreshSignal: number
  refetchNow: () => void
}

export function useLiveFeed(pollIntervalMs = 4000): UseLiveFeedReturn {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("disconnected")
  const [lastEvent, setLastEvent] = useState<LiveFeedEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshSignal, setRefreshSignal] = useState<number>(0)

  const lastEventIdRef = useRef<string | null>(null)

  const triggerRefresh = useCallback(() => {
    setRefreshSignal((prev) => prev + 1)
  }, [])

  // Setup Supabase Realtime subscription with automatic Polling fallback
  useEffect(() => {
    let isSubscribed = true
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (!isSubscribed) return
      setConnectionMode("polling")

      pollTimer = setInterval(async () => {
        try {
          const events = await api.getEvents({
            sinceId: lastEventIdRef.current || undefined,
            limit: 5,
          })

          if (events && events.length > 0) {
            const latest = events[0]
            if (latest.id !== lastEventIdRef.current) {
              lastEventIdRef.current = latest.id
              setLastEvent(latest)
              triggerRefresh()
            }
          }
          setError(null)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Polling update failed")
        }
      }, pollIntervalMs)
    }

    // Try Supabase Realtime connection if env key exists
    const hasSupabaseConfig =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      !import.meta.env.VITE_SUPABASE_URL.includes("placeholder")

    if (hasSupabaseConfig) {
      const channel = supabase
        .channel("public:event_log")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "event_log" },
          (payload) => {
            if (!isSubscribed) return
            const newEvt: LiveFeedEvent = {
              id: payload.new.id || `evt-${Date.now()}`,
              type: payload.new.type || "EVENT_UPDATE",
              entityId: payload.new.entity_id || payload.new.entityId || "",
              payload: payload.new.payload || payload.new,
              createdAt: payload.new.created_at || new Date().toISOString(),
            }
            lastEventIdRef.current = newEvt.id
            setLastEvent(newEvt)
            setConnectionMode("realtime")
            triggerRefresh()
          }
        )
        .subscribe((status) => {
          if (!isSubscribed) return
          if (status === "SUBSCRIBED") {
            setConnectionMode("realtime")
            setError(null)
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            // Fallback to polling if Supabase Realtime fails
            setConnectionMode("polling")
            if (!pollTimer) startPolling()
          }
        })

      return () => {
        isSubscribed = false
        if (pollTimer) clearInterval(pollTimer)
        supabase.removeChannel(channel)
      }
    } else {
      // Fallback to polling mode directly
      startPolling()
      return () => {
        isSubscribed = false
        if (pollTimer) clearInterval(pollTimer)
      }
    }
  }, [pollIntervalMs, triggerRefresh])

  return {
    connectionMode,
    lastEvent,
    error,
    refreshSignal,
    refetchNow: triggerRefresh,
  }
}
