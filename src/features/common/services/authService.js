const { BrowserWindow, shell } = require('electron');
const neonAuthService = require('./neonAuthService');
const encryptionService = require('./encryptionService');
const sessionRepository = require('../repositories/session');
const permissionService = require('./permissionService');

class AuthService {
    constructor() {
        this.currentUserId = 'default_user';
        this.currentUserMode = 'local'; // 'local' or 'neon'
        this.currentUser = null;
        this.isInitialized = false;

        // This ensures the key is ready before any login/logout state change.
        this.initializationPromise = null;

        sessionRepository.setAuthService(this);
    }

    initialize() {
        if (this.isInitialized) return this.initializationPromise;

        this.initializationPromise = new Promise(async (resolve) => {
            try {
                // Initialize Neon Auth Service
                await neonAuthService.initialize();
                
                // Get current user state from Neon Auth
                const currentUser = neonAuthService.getCurrentUser();
                
                if (currentUser.isLoggedIn) {
                    // User is logged in with Neon Auth
                    console.log(`[AuthService] Neon Auth user found:`, currentUser.uid);
                    this.currentUser = currentUser;
                    this.currentUserId = currentUser.uid;
                    this.currentUserMode = 'neon';

                    // Clean up any zombie sessions from a previous run for this user.
                    await sessionRepository.endAllActiveSessions();

                    // ** Initialize encryption key for the logged-in user if permissions are already granted **
                    if (process.platform === 'darwin' && !(await permissionService.checkKeychainCompleted(this.currentUserId))) {
                        console.warn('[AuthService] Keychain permission not yet completed for this user. Deferring key initialization.');
                    } else {
                        await encryptionService.initializeKey(currentUser.uid);
                    }

                    // Update model state service with user info
                    if (global.modelStateService) {
                        await global.modelStateService.setNeonAuthUser(currentUser);
                    }
                    console.log(`[AuthService] Neon Auth user ${currentUser.email} has been processed and state updated.`);

                } else {
                    // User is not logged in - local mode
                    console.log(`[AuthService] No Neon Auth user - using local mode.`);
                    this.currentUser = null;
                    this.currentUserId = 'default_user';
                    this.currentUserMode = 'local';

                    // End active sessions for the local/default user as well.
                    await sessionRepository.endAllActiveSessions();

                    encryptionService.resetSessionKey();
                }
                
                this.broadcastUserState();
                
                if (!this.isInitialized) {
                    this.isInitialized = true;
                    console.log('[AuthService] Initialized and resolved initialization promise.');
                    resolve();
                }
            } catch (error) {
                console.error('[AuthService] Error during initialization:', error);
                this.currentUser = null;
                this.currentUserId = 'default_user';
                this.currentUserMode = 'local';
                this.isInitialized = true;
                resolve();
            }
        });

        return this.initializationPromise;
    }

    async startNeonAuthFlow() {
        try {
            const result = await neonAuthService.startAuthFlow();
            console.log(`[AuthService] Neon Auth flow started:`, result);
            return result;
        } catch (error) {
            console.error('[AuthService] Failed to start Neon Auth flow:', error);
            return { success: false, error: error.message };
        }
    }

    async handleNeonAuthCallback(params) {
        try {
            const result = await neonAuthService.handleAuthCallback(params);
            
            if (result.success) {
                // Update local state
                this.currentUser = result.user;
                this.currentUserId = result.user.id;
                this.currentUserMode = 'neon';
                
                // Clean up any zombie sessions from a previous run for this user.
                await sessionRepository.endAllActiveSessions();

                // Initialize encryption key if permissions are granted
                if (process.platform === 'darwin' && !(await permissionService.checkKeychainCompleted(this.currentUserId))) {
                    console.warn('[AuthService] Keychain permission not yet completed for this user. Deferring key initialization.');
                } else {
                    await encryptionService.initializeKey(result.user.id);
                }

                // Update model state service
                if (global.modelStateService) {
                    await global.modelStateService.setNeonAuthUser(result.user);
                }
                
                this.broadcastUserState();
            }
            
            return result;
        } catch (error) {
            console.error('[AuthService] Error handling Neon Auth callback:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            // End all active sessions for the current user BEFORE signing out.
            await sessionRepository.endAllActiveSessions();

            // Sign out from Neon Auth
            await neonAuthService.signOut();
            
            // Clear local state
            this.currentUser = null;
            this.currentUserId = 'default_user';
            this.currentUserMode = 'local';
            
            // Clear model state
            if (global.modelStateService) {
                await global.modelStateService.clearNeonAuthUser();
            }
            
            encryptionService.resetSessionKey();
            
            console.log('[AuthService] User sign-out completed successfully.');
            this.broadcastUserState();
            
        } catch (error) {
            console.error('[AuthService] Error signing out:', error);
        }
    }
    
    broadcastUserState() {
        const userState = this.getCurrentUser();
        console.log('[AuthService] Broadcasting user state change:', userState);
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
                win.webContents.send('user-state-changed', userState);
            }
        });
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    getCurrentUser() {
        const isLoggedIn = !!(this.currentUserMode === 'neon' && this.currentUser);

        if (isLoggedIn) {
            return {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL,
                mode: 'neon',
                isLoggedIn: true,
                role: this.currentUser.role,
                currentPlan: this.currentUser.currentPlan
            };
        }
        return {
            uid: this.currentUserId, // returns 'default_user'
            email: 'contact@glass.dev',
            displayName: 'Default User',
            mode: 'local',
            isLoggedIn: false,
        };
    }

    // Compatibility methods for existing code
    async startFirebaseAuthFlow() {
        // Redirect Firebase auth calls to Neon Auth
        return await this.startNeonAuthFlow();
    }

    async signInWithCustomToken(token) {
        // This method is deprecated - redirect to Neon Auth
        console.warn('[AuthService] signInWithCustomToken is deprecated. Use Neon Auth instead.');
        throw new Error('Firebase custom token authentication is no longer supported. Please use Neon Auth.');
    }

    // Helper method to get auth token for backend requests
    getAuthToken() {
        return neonAuthService.getAuthToken();
    }

    isAuthenticated() {
        return neonAuthService.isAuthenticated();
    }

    // Helper method to make authenticated requests to backend
    async makeAuthenticatedRequest(endpoint, options = {}) {
        return await neonAuthService.makeAuthenticatedRequest(endpoint, options);
    }
}

const authService = new AuthService();
module.exports = authService; 