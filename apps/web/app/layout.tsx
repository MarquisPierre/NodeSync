import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/features/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";
import { ClerkProvider } from '@clerk/nextjs'

const font = Geist({subsets:['latin'],variable:'--font-sans'})
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", fontMono.variable, "font-sans", font.variable)}
    >
      <body className="h-full">
        <ClerkProvider afterSignOutUrl="/">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}