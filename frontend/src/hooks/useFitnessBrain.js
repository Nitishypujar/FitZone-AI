import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function getFitnessTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export const FITNESS_BRAIN_QUERY_KEY = 'fitness-brain'

export function useFitnessBrain(options = {}) {
  const timeZone = options.timeZone || getFitnessTimeZone()
  const enabled = options.enabled ?? Boolean(localStorage.getItem('fitzone_access_token'))

  return useQuery({
    queryKey: [FITNESS_BRAIN_QUERY_KEY, timeZone],
    queryFn: async () => {
      const data = await api.get(`/api/intelligence/snapshot?timezone=${encodeURIComponent(timeZone)}`)
      const snapshot = data?.data || data
      return {
        status: data?.status || 'success',
        ...snapshot,
        intelligence: snapshot?.intelligence || snapshot,
      }
    },
    enabled,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: options.refetchInterval ?? 60 * 1000,
  })
}
