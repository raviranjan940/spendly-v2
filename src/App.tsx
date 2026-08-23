import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react"
import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { ThemeProvider, useTheme } from "@/hooks/use-theme"
import { Toaster } from "sonner"

const Dashboard = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.Dashboard }))
)
const Landing = lazy(() =>
  import("@/pages/landing").then((m) => ({ default: m.Landing }))
)
const AuthPage = lazy(() =>
  import("@/pages/auth").then((m) => ({ default: m.AuthPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemedToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemedToaster />
            <Suspense
              fallback={
                <div className="flex min-h-dvh items-center justify-center bg-background">
                  <span className="size-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
                <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Catch-all: signed-in → dashboard, else → landing */}
                <Route
                  path="*"
                  element={
                    <>
                      <SignedIn>
                        <Navigate to="/dashboard" replace />
                      </SignedIn>
                      <SignedOut>
                        <Navigate to="/" replace />
                      </SignedOut>
                    </>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
