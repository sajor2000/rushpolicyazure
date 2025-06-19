import './globals.css'

export const metadata = {
  title: 'Rush Policy Assistant',
  description: 'Official Rush University Policy Chat Assistant',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}