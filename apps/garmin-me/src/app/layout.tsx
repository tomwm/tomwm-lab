import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Sidebar } from '@/components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Garmin Me',
  description: 'Personal Garmin training and recovery dashboard',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

// Apply a saved manual theme before first paint; with none saved, CSS follows the OS.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Suspense>
          <Sidebar />
        </Suspense>
        <main className="md:pl-56">{children}</main>
      </body>
    </html>
  )
}
