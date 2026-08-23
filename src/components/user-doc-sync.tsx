import { useEffect, useRef } from "react"
import { useUser } from "@clerk/clerk-react"

import { ensureUserDoc } from "@/api/users"

/**
 * Ensures a Firestore profile document exists for the signed-in Clerk user,
 * regardless of which auth method created the session.
 */
export function UserDocSync() {
  const { isLoaded, user } = useUser()
  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return
    if (syncedUserIdRef.current === user.id) return
    syncedUserIdRef.current = user.id

    ensureUserDoc({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      primaryEmail:
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "",
    }).catch((error) => {
      console.error("Error creating user doc:", error)
      syncedUserIdRef.current = null
    })
  }, [isLoaded, user])

  return null
}
