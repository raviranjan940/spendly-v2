import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addTransaction as addTransactionApi,
  bulkAddTransactions,
  deleteAllTransactions,
  deleteTransaction as deleteTransactionApi,
  fetchTransactions,
  updateTransaction as updateTransactionApi,
} from "@/api/transactions"
import type { NewTransaction, Transaction } from "@/types"

const transactionsKey = (userId: string) => ["transactions", userId] as const

export function useTransactions(userId: string | null | undefined) {
  return useQuery({
    queryKey: transactionsKey(userId ?? "anonymous"),
    queryFn: () => fetchTransactions(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })
}

export function useAddTransaction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (t: NewTransaction) => addTransactionApi(userId, t),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKey(userId) })
      toast.success("Transaction added")
    },
    onError: () => toast.error("Couldn't add transaction"),
  })
}

export function useBulkAddTransactions(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (list: NewTransaction[]) => ({
      added: await bulkAddTransactions(userId, list),
      submitted: list.length,
    }),
    onSuccess: ({ added, submitted }) => {
      void queryClient.invalidateQueries({
        queryKey: transactionsKey(userId),
      })
      const skipped = submitted - added
      if (added > 0) {
        toast.success(
          `${added} transaction${added !== 1 ? "s" : ""} imported`
        )
      }
      if (skipped > 0) {
        toast.warning(
          `${skipped} row${skipped !== 1 ? "s" : ""} skipped (invalid)`
        )
      }
      if (submitted === 0) {
        toast.error("No rows found in file")
      }
    },
    onError: () => toast.error("Import failed"),
  })
}

export function useUpdateTransaction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (t: Transaction) => updateTransactionApi(userId, t),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKey(userId) })
      toast.success("Transaction updated")
    },
    onError: () => toast.error("Couldn't update transaction"),
  })
}

export function useDeleteTransaction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransactionApi(userId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKey(userId) })
      toast.success("Transaction deleted")
    },
    onError: () => toast.error("Couldn't delete transaction"),
  })
}

export function useResetTransactions(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteAllTransactions(userId),
    onSuccess: () => {
      queryClient.setQueryData(transactionsKey(userId), [])
      toast.success("Ledger reset — fresh start!")
    },
    onError: () => toast.error("Failed to reset transactions"),
  })
}
