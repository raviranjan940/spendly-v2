import type { IconType } from "react-icons"
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaWhatsapp,
  FaGlobe,
} from "react-icons/fa"
import { FaSquareXTwitter } from "react-icons/fa6"
import { TrendingUp } from "lucide-react"

interface SocialLink {
  href: string
  icon: IconType
  label: string
}

const socialLinks: SocialLink[] = [
  { href: "https://x.com/RaviRanjan_940", icon: FaSquareXTwitter, label: "X (Twitter)" },
  { href: "https://www.instagram.com/raviranjan_143", icon: FaInstagram, label: "Instagram" },
  { href: "https://www.linkedin.com/in/raviranjan940/", icon: FaLinkedin, label: "LinkedIn" },
  { href: "https://github.com/raviranjan940", icon: FaGithub, label: "GitHub" },
  {
    href: "https://www.facebook.com/profile.php?id=100013827531045",
    icon: FaFacebook,
    label: "Facebook",
  },
  { href: "https://iamraviranjan.vercel.app/", icon: FaGlobe, label: "Portfolio" },
]

export function AppFooter() {
  const handleContactDeveloper = () => {
    window.open("https://wa.me/6204743523", "_blank")
  }

  return (
    <footer className="mt-12 border-t border-border bg-card transition-colors">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Branding */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                Spendly<span className="text-primary">.</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your expenses with ease and take control of your finances.
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Connect
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Contact
            </h3>
            <button
              onClick={handleContactDeveloper}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-income/30 bg-income/10 px-4 py-2 text-sm font-medium text-income transition-all duration-200 hover:border-income/50 hover:bg-income/20"
            >
              <FaWhatsapp className="h-4 w-4" />
              Chat on WhatsApp
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Spendly — Proudly Made with ❤️ in India by{" "}
            <span className="font-medium text-foreground">Ravi Ranjan</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
