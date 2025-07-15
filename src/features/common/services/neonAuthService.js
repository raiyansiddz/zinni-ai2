const { BrowserWindow, shell } = require('electron');
const fetch = require('node-fetch');
const Store = require('electron-store');

class NeonAuthService {
    constructor() {
        this.currentUserId = null;
        this.currentUser = null;
        this.authToken = null;
        this.isInitialized = false;
        
        // Store for persisting auth state
        this.store = new Store({ name: 'neon-auth-session' });
        
        // Neon Auth configuration
        this.config = {
            projectId: '9474a952-de9c-424b-830f-c78480058e0b',
            publishableKey: 'pck_8k4vap35ke0nnpn4pe6sa72axx1dwpsqp24w0246yr720',
            authUrl: 'https://neon-auth.com/auth'
        };
        
        console.log('[NeonAuthService] Service initialized');
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
            const { code } = params;
            
            if (!code) {
                throw new Error('Authorization code not received');
            }

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

            const { access_token, user } = tokenData;
            
            // Store auth data
            this.authToken = access_token;
            this.currentUser = user;
            this.currentUserId = user.id;
            
            // Persist to storage
            this.store.set('authToken', access_token);
            this.store.set('user', user);
            
            console.log('[NeonAuthService] Authentication successful for user:', user.id);
            
            // Broadcast user state change
            this.broadcastUserState();
            
            return { success: true, user };
            
        } catch (error) {
            console.error('[NeonAuthService] Auth callback error:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyToken() {
        if (!this.authToken) {
            return false;
        }

        try {
            const FASTAPI_URL = 'http://localhost:8002';
            const response = await fetch(`${FASTAPI_URL}/api/auth/verify`, {
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
                id: this.currentUser.id,
                email: this.currentUser.email,
                displayName: this.currentUser.display_name || this.currentUser.email,
                photoURL: this.currentUser.photo_url,
                isLoggedIn: true,
                authToken: this.authToken
            };
        }
        
        return {
            id: null,
            email: null,
            displayName: 'Guest User',
            photoURL: null,
            isLoggedIn: false,
            authToken: null
        };
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    getAuthToken() {
        return this.authToken;
    }

    isAuthenticated() {
        return !!(this.authToken && this.currentUser);
    }
}

const neonAuthService = new NeonAuthService();
module.exports = neonAuthService;