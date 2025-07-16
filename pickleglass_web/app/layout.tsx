import './globals.css'
import { Inter } from 'next/font/google'
import { StackProvider } from '@stackframe/stack'
import { stackClientApp } from '@/utils/stack-auth'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Glass AI - AI Assistant',
  description: 'Personalized AI Assistant for various contexts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={stackClientApp}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </StackProvider>
      </body>
    </html>
  )
} 