import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Shown exactly once per device/browser — set the moment the popup
// appears, regardless of whether the user installs, dismisses or ignores it.
const SHOWN_KEY = "spendly-install-prompted"

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isMobileDevice(): boolean {
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || !isMobileDevice()) return
    if (localStorage.getItem(SHOWN_KEY)) return

    const markShown = () => localStorage.setItem(SHOWN_KEY, "1")

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      window.setTimeout(() => {
        markShown()
        setVisible(true)
      }, 1200)
    }

    const handleInstalled = () => {
      setInstallEvent(null)
      setVisible(false)
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    // iOS Safari never fires beforeinstallprompt — show manual instructions.
    let timer: number | undefined
    if (isIos()) {
      timer = window.setTimeout(() => {
        markShown()
        setVisible(true)
      }, 1200)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-sm">
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40">
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/icons/icon-192.png"
            alt="Spendly logo"
            className="size-12 shrink-0 rounded-xl border border-white/10"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Add Spendly to Home Screen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One-tap access with a full-screen app experience.
            </p>
          </div>
        </div>

        {installEvent ? (
          <Button className="mt-3 w-full" onClick={install}>
            Add to Home Screen
          </Button>
        ) : (
          <p className="mt-3 rounded-lg bg-secondary/70 p-2.5 text-xs leading-relaxed text-secondary-foreground">
            On iPhone: tap the <span className="font-semibold">Share</span>{" "}
            icon in the browser toolbar, then choose{" "}
            <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>.
            The Spendly logo will appear on your home screen.
          </p>
        )}
      </div>
    </div>
  )
}
