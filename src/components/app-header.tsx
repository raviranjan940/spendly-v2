import { useState } from "react"
import { useClerk, useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom"
import {
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsDialog } from "@/components/settings-dialog"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const { theme, toggleTheme } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const avatarSrc = user?.imageUrl || ""
  const userName =
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "Account"
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    ""

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/70 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 transition-colors",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="group flex items-center gap-2 font-display text-xl font-bold text-foreground transition-colors hover:text-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/25 transition-shadow group-hover:shadow-primary/45">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </span>
          <span>
            Spendly<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>

          {isLoaded && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User menu"
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border/80 py-1 pr-2 pl-1 transition-all hover:border-primary/40 hover:bg-secondary/60 focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="relative size-8 overflow-hidden rounded-full border border-primary/30 bg-secondary">
                    {avatarSrc && (
                      <img
                        src={avatarSrc}
                        alt={userName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span className="hidden max-w-[90px] truncate text-sm font-medium sm:block">
                    {userName}
                  </span>
                  <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2.5 py-1">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                      {avatarSrc && (
                        <img
                          src={avatarSrc}
                          alt={userName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {userName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                  className="cursor-pointer"
                >
                  <Settings className="text-primary" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => void signOut()}
                  className="cursor-pointer"
                >
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {user && (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </header>
  )
}
