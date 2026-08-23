import { Loader2, RefreshCw, TriangleAlert } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ResetBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  pending?: boolean
  transactionCount: number
}

export function ResetBalanceDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  transactionCount,
}: ResetBalanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-5" />
            Reset your entire ledger?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <strong className="text-foreground">
              all {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
            </strong>{" "}
            and zero out your balance. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            <RefreshCw className="size-4" />
            Yes, reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
