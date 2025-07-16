'use client'

import { useRouter } from 'next/navigation'
import { stackClientApp } from '@/utils/stack-auth'
import { Chrome } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isElectronMode, setIsElectronMode] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    setIsElectronMode(mode === 'electron')
  }, [])

  const handleStackSignIn = async () => {
    setIsLoading(true)
    
    try {
      // Use Stack Auth for authentication
      await stackClientApp.signInWithOAuth('google', {
        redirectUrl: window.location.origin + '/dashboard'
      })
    } catch (error: any) {
      console.error('❌ Stack Auth login failed:', error)
      
      if (error.code !== 'auth/popup-closed-by-user') {
        alert('An error occurred during login. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalMode = () => {
    if (isElectronMode) {
      window.location.href = 'pickleglass://auth-success?uid=default_user&email=contact@glass.com&displayName=Default%20User'
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Glass AI</h1>
        <p className="text-gray-600 mt-2">Sign in with your Google account to sync your data across all devices.</p>
        {isElectronMode ? (
          <p className="text-sm text-blue-600 mt-1 font-medium">🔗 Login requested from Electron app</p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Local mode will run if you don't sign in.</p>
        )}
      </div>
      
      <div className="w-full max-w-sm">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <button
            onClick={handleStackSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="h-5 w-5" />
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={handleLocalMode}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Continue in local mode
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
} 