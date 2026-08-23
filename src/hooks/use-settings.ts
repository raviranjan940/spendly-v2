import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  DEFAULT_SETTINGS,
  fetchUserSettings,
  saveUserSettings,
} from "@/api/users"
import type { UserSettings } from "@/types"

const settingsKey = (userId: string) => ["settings", userId] as const

export function useUserSettings(userId: string | null | undefined) {
  return useQuery({
    queryKey: settingsKey(userId ?? "anonymous"),
    queryFn: async () => {
      const settings = await fetchUserSettings(userId!)
      // Merge defaults so legacy docs without tags still render sensibly.
      return {
        expenseTags: settings.expenseTags.length
          ? settings.expenseTags
          : DEFAULT_SETTINGS.expenseTags,
        incomeTags: settings.incomeTags.length
          ? settings.incomeTags
          : DEFAULT_SETTINGS.incomeTags,
        currency: settings.currency,
      } satisfies UserSettings
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  })
}

export function useSaveSettings(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Partial<UserSettings>) =>
      saveUserSettings(userId, settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKey(userId) })
      toast.success("Settings saved")
    },
    onError: () => toast.error("Couldn't save settings"),
  })
}
