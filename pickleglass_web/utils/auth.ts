import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, setUserInfo, findOrCreateUser } from './api'
import { stackClientApp } from './stack-auth'

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState<'stack' | 'local' | null>(null)
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current user from Stack Auth
        const stackUser = await stackClientApp.getUser()
        
        if (stackUser) {
          console.log('🔐 Stack Auth mode activated:', stackUser.id);
          setMode('stack');
          
          let profile: UserProfile = {
            uid: stackUser.id,
            display_name: stackUser.displayName || stackUser.primaryEmail || 'User',
            email: stackUser.primaryEmail || 'no-email@example.com',
          };
          
          try {
            profile = await findOrCreateUser(profile);
            console.log('✅ User profile created/verified:', profile);
          } catch (error) {
            console.error('❌ User profile creation/verification failed:', error);
          }

          setUser(profile);
          setUserInfo(profile);
        } else {
          console.log('🏠 Local mode activated');
          setMode('local');
          
          const defaultLocalUser: UserProfile = {
            uid: 'default_user',
            display_name: 'Default User',
            email: 'contact@glass.com',
          };
          
          setUser(defaultLocalUser);
          setUserInfo(defaultLocalUser);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setMode('local');
        
        const defaultLocalUser: UserProfile = {
          uid: 'default_user',
          display_name: 'Default User',
          email: 'contact@glass.com',
        };
        
        setUser(defaultLocalUser);
        setUserInfo(defaultLocalUser);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [])

  return { user, isLoading, mode }
}

export const useRedirectIfNotAuth = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // This hook allows both authenticated and local mode
    // Add redirect logic here if needed for specific routes
  }, [user, isLoading, router])

  return user
} 