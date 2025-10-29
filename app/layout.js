import './globals.css'
import { Toaster } from './components/ui/sonner'
import ErrorBoundary from './components/ErrorBoundary'

export const metadata = {
  title: 'Rush Policy Assistant',
  description: 'Official Rush University Policy Chat Assistant',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}