import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserSettings } from "@/types"

export const DEFAULT_SETTINGS: UserSettings = {
  expenseTags: ["Food", "Transport", "Bills", "Shopping"],
  incomeTags: ["Salary", "Freelance", "Investment", "Gift"],
  currency: "INR",
}

interface UserDocData {
  name?: string
  email?: string
  photoURL?: string
  expenseTags?: unknown
  incomeTags?: unknown
  currency?: unknown
  createdAt?: unknown
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : []
}

function toSettings(data: UserDocData): UserSettings {
  return {
    expenseTags: toStringArray(data.expenseTags),
    incomeTags: toStringArray(data.incomeTags),
    currency: typeof data.currency === "string" ? data.currency : DEFAULT_SETTINGS.currency,
  }
}

/** Ensure the Firestore profile document exists for a Clerk user. */
export async function ensureUserDoc(user: {
  id: string
  firstName: string | null | undefined
  lastName: string | null | undefined
  username: string | null | undefined
  imageUrl: string
  primaryEmail: string
}): Promise<void> {
  const ref = doc(db, "users", user.id)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      user.primaryEmail.split("@")[0] ||
      "User"

    await setDoc(ref, {
      name,
      email: user.primaryEmail,
      photoURL: user.imageUrl || "",
      ...DEFAULT_SETTINGS,
      createdAt: serverTimestamp(),
    })
    return
  }

  // Backfill defaults for docs created by the legacy app (no tags/currency yet).
  const data = snap.data() as UserDocData
  if (
    data.expenseTags === undefined ||
    data.incomeTags === undefined ||
    data.currency === undefined
  ) {
    await setDoc(
      ref,
      {
        ...(data.expenseTags === undefined
          ? { expenseTags: DEFAULT_SETTINGS.expenseTags }
          : {}),
        ...(data.incomeTags === undefined
          ? { incomeTags: DEFAULT_SETTINGS.incomeTags }
          : {}),
        ...(data.currency === undefined ? { currency: DEFAULT_SETTINGS.currency } : {}),
      },
      { merge: true }
    )
  }
}

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const snap = await getDoc(doc(db, "users", userId))
  if (!snap.exists()) return DEFAULT_SETTINGS
  return toSettings(snap.data() as UserDocData)
}

export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  await setDoc(doc(db, "users", userId), settings, { merge: true })
}
