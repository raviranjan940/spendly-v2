import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { isValidStoredDate } from "@/lib/dates"
import type { NewTransaction, Transaction } from "@/types"

const MAX_BATCH = 450

function transactionsRef(userId: string) {
  return collection(db, "users", userId, "transactions")
}

/** Firestore docs may predate the `dateMs` sort field; derive it if missing. */
function normalize(id: string, data: Record<string, unknown>): Transaction {
  const date = typeof data.date === "string" ? data.date : ""
  return {
    id,
    name: String(data.name ?? ""),
    amount: Number(data.amount ?? 0),
    date,
    tag: String(data.tag ?? ""),
    type: data.type === "income" ? "income" : "expense",
  }
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const snapshot = await getDocs(
    query(transactionsRef(userId), orderBy("dateMs", "desc"))
  )
  return snapshot.docs.map((d) => normalize(d.id, d.data()))
}

export async function addTransaction(
  userId: string,
  transaction: NewTransaction
): Promise<void> {
  await addDoc(transactionsRef(userId), {
    ...transaction,
    dateMs: parseDateMs(transaction.date),
    createdAt: serverTimestamp(),
  })
}

export async function bulkAddTransactions(
  userId: string,
  transactions: NewTransaction[]
): Promise<number> {
  let added = 0
  for (let i = 0; i < transactions.length; i += MAX_BATCH) {
    const batch = writeBatch(db)
    for (const t of transactions.slice(i, i + MAX_BATCH)) {
      batch.set(doc(transactionsRef(userId)), {
        ...t,
        dateMs: parseDateMs(t.date),
        createdAt: serverTimestamp(),
      })
      added++
    }
    await batch.commit()
  }
  return added
}

export async function updateTransaction(
  userId: string,
  transaction: Transaction
): Promise<void> {
  const { id, ...rest } = transaction
  await updateDoc(doc(db, "users", userId, "transactions", id), {
    ...rest,
    dateMs: parseDateMs(transaction.date),
  })
}

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "transactions", transactionId))
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  const snapshot = await getDocs(transactionsRef(userId))
  for (let i = 0; i < snapshot.docs.length; i += MAX_BATCH) {
    const batch = writeBatch(db)
    snapshot.docs.slice(i, i + MAX_BATCH).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

function parseDateMs(date: string): number | null {
  if (!isValidStoredDate(date)) return null
  const [day, month, year] = date.split("-").map(Number)
  return new Date(year, month - 1, day).getTime()
}
