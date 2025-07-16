const { BrowserWindow, shell } = require('electron');
const fetch = require('node-fetch');
const Store = require('electron-store');
const config = require('../../../config/environment');

class NeonAuthService {
    constructor() {
        this.currentUserId = null;
        this.currentUser = null;
        this.authToken = null;
        this.isInitialized = false;
        this.backendUrl = config.BACKEND_URL;
        
        // Store for persisting auth state
        this.store = new Store({ name: 'neon-auth-session' });
        
        // Neon Auth configuration
        this.config = {
            projectId: config.NEON_AUTH.PROJECT_ID,
            publishableKey: config.NEON_AUTH.PUBLISHABLE_KEY,
            authUrl: config.NEON_AUTH.AUTH_URL
        };
        
        console.log('[NeonAuthService] Service initialized with backend URL:', this.backendUrl);
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Try to restore previous session
            const savedToken = this.store.get('authToken');
            const savedUser = this.store.get('user');
            
            if (savedToken && savedUser) {
                console.log('[NeonAuthService] Restoring previous session');
                this.authToken = savedToken;
                this.currentUser = savedUser;
                this.currentUserId = savedUser.id;
                
                // Verify token is still valid
                const isValid = await this.verifyToken();
                if (isValid) {
                    console.log('[NeonAuthService] Session restored successfully');
                    this.broadcastUserState();
                } else {
                    console.log('[NeonAuthService] Stored token is invalid, clearing session');
                    this.clearSession();
                }
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('[NeonAuthService] Error during initialization:', error);
            this.clearSession();
        }
    }

    async startAuthFlow() {
        try {
            // Create auth URL for Neon Auth
            const authUrl = `${this.config.authUrl}?project_id=${this.config.projectId}&redirect_uri=pickleglass://auth-success&response_type=code`;
            
            console.log(`[NeonAuthService] Opening Neon Auth URL: ${authUrl}`);
            await shell.openExternal(authUrl);
            
            return { success: true };
        } catch (error) {
            console.error('[NeonAuthService] Failed to start auth flow:', error);
            return { success: false, error: error.message };
        }
    }

    async handleAuthCallback(params) {
        try {
            const { token, access_token, code } = params;
            
            // Handle direct token or code
            let finalToken = token || access_token;
            
            if (code && !finalToken) {
                console.log('[NeonAuthService] Exchanging authorization code for token');
                
                // Exchange code for access token
                const tokenResponse = await fetch('https://api.stack-auth.com/api/v1/auth/tokens/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        project_id: this.config.projectId,
                        publishable_client_key: this.config.publishableKey,
                        code: code,
                        redirect_uri: 'pickleglass://auth-success'
                    })
                });

                const tokenData = await tokenResponse.json();
                
                if (!tokenResponse.ok) {
                    throw new Error(tokenData.error || 'Token exchange failed');
                }

                finalToken = tokenData.access_token;
            }
            
            if (!finalToken) {
                throw new Error('No token received from authentication');
            }

            // Get user profile from backend
            const userProfile = await this.getUserProfile(finalToken);
            
            if (!userProfile) {
                throw new Error('Failed to get user profile');
            }

            // Store auth data
            this.authToken = finalToken;
            this.currentUser = userProfile;
            this.currentUserId = userProfile.id;
            
            // Persist to storage
            this.store.set('authToken', finalToken);
            this.store.set('user', userProfile);
            
            console.log('[NeonAuthService] Authentication successful for user:', userProfile.email);
            
            // Broadcast user state change
            this.broadcastUserState();
            
            return { success: true, user: userProfile };
            
        } catch (error) {
            console.error('[NeonAuthService] Auth callback error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(token) {
        try {
            const response = await fetch(`${this.backendUrl}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('[NeonAuthService] Get user profile error:', error);
            return null;
        }
    }

    async verifyToken() {
        if (!this.authToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.backendUrl}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('[NeonAuthService] Token verification failed:', error);
            return false;
        }
    }

    async refreshToken() {
        // Neon Auth refresh implementation would go here
        // For now, we'll just verify the current token
        return await this.verifyToken();
    }

    async signOut() {
        try {
            console.log('[NeonAuthService] Signing out user');
            
            // Clear session
            this.clearSession();
            
            // Broadcast state change
            this.broadcastUserState();
            
            return { success: true };
        } catch (error) {
            console.error('[NeonAuthService] Error during sign out:', error);
            return { success: false, error: error.message };
        }
    }

    clearSession() {
        this.authToken = null;
        this.currentUser = null;
        this.currentUserId = null;
        
        // Clear persisted data
        this.store.clear();
        
        console.log('[NeonAuthService] Session cleared');
    }

    broadcastUserState() {
        const userState = this.getCurrentUser();
        console.log('[NeonAuthService] Broadcasting user state:', userState);
        
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
                win.webContents.send('user-state-changed', userState);
            }
        });
    }

    getCurrentUser() {
        if (this.currentUser && this.authToken) {
            return {
                uid: this.currentUser.id,
                email: this.currentUser.email,
                displayName: this.currentUser.display_name || this.currentUser.email,
                photoURL: this.currentUser.photo_url,
                role: this.currentUser.role,
                currentPlan: this.currentUser.current_plan,
                isLoggedIn: true,
                mode: 'neon'
            };
        }
        
        return {
            uid: 'default_user',
            email: 'contact@glass.dev',
            displayName: 'Default User',
            photoURL: null,
            isLoggedIn: false,
            mode: 'local'
        };
    }

    getCurrentUserId() {
        return this.currentUserId || 'default_user';
    }

    getAuthToken() {
        return this.authToken;
    }

    isAuthenticated() {
        return !!(this.authToken && this.currentUser);
    }

    // Helper method to make authenticated requests to backend
    async makeAuthenticatedRequest(endpoint, options = {}) {
        const token = this.getAuthToken();
        
        if (!token) {
            throw new Error('No authentication token available');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        const response = await fetch(`${this.backendUrl}${endpoint}`, finalOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, clear session
                this.clearSession();
                this.broadcastUserState();
                throw new Error('Authentication expired');
            }
            throw new Error(`Request failed: ${response.status}`);
        }

        return response.json();
    }
}

const neonAuthService = new NeonAuthService();
module.exports = neonAuthService;