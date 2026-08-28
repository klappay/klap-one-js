import type { ReactNode } from 'react'

export const metadata = {
  title: '@klappay/one — Next.js example',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
