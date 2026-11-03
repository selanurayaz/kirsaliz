import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMyServiceRequests, LOAD_REQUESTS_ERROR } from '@/lib/service-requests'
import { toUserMessage } from '@/lib/errors'
import type { ServiceRequestWithRelations } from '@/types/database'

/** Oturumdaki vatandaşın taleplerini yükler. */
export function useMyServiceRequests() {
  const { user } = useAuth()
  const userId = user?.id
  const [requests, setRequests] = useState<ServiceRequestWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri yüklemesi başlarken yükleme durumu sıfırlanır
    setLoading(true)
    setError(null)
    getMyServiceRequests(userId)
      .then((data) => {
        if (active) setRequests(data)
      })
      .catch((err: unknown) => {
        if (active) setError(toUserMessage(err, LOAD_REQUESTS_ERROR))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { requests, loading, error, reload }
}
