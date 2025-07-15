const fetch = require('node-fetch');
const neonAuthService = require('./neonAuthService');

class BackendApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8002';
    }

    async makeRequest(endpoint, options = {}) {
        const token = neonAuthService.getAuthToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add authorization header if token exists
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, clear session
                    neonAuthService.clearSession();
                    neonAuthService.broadcastUserState();
                    throw new Error('Authentication expired');
                }
                throw new Error(`Request failed: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`[BackendApiService] Request to ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Auth endpoints
    async verifyToken() {
        return this.makeRequest('/api/auth/verify', { method: 'POST' });
    }

    async getCurrentUser() {
        return this.makeRequest('/api/auth/me', { method: 'GET' });
    }

    async getAuthStatus() {
        return this.makeRequest('/api/auth/status', { method: 'GET' });
    }

    // AI endpoints
    async sendAskRequest(prompt, screenContext = null, audioTranscript = null) {
        return this.makeRequest('/api/ask/', {
            method: 'POST',
            body: JSON.stringify({
                prompt,
                screen_context: screenContext,
                audio_transcript: audioTranscript
            })
        });
    }

    async getAskMessages(sessionId) {
        return this.makeRequest(`/api/ask/messages?session_id=${sessionId}`, { method: 'GET' });
    }

    async getAiProviders() {
        return this.makeRequest('/api/ask/providers', { method: 'GET' });
    }

    // Plan endpoints
    async getCurrentPlan() {
        return this.makeRequest('/api/plan/current', { method: 'GET' });
    }

    async getPlanUsage() {
        return this.makeRequest('/api/plan/usage', { method: 'GET' });
    }

    async getAllPlans() {
        return this.makeRequest('/api/plan/', { method: 'GET' });
    }

    // Usage tracking
    async trackUsage(actionType, resourceUsed = null, quantity = 1) {
        return this.makeRequest('/api/track/', {
            method: 'POST',
            body: JSON.stringify({
                action_type: actionType,
                resource_used: resourceUsed,
                quantity
            })
        });
    }

    async getUsageSessions() {
        return this.makeRequest('/api/track/sessions', { method: 'GET' });
    }

    async getSessionUsage(sessionId) {
        return this.makeRequest(`/api/track/session?session_id=${sessionId}`, { method: 'GET' });
    }

    // User profile
    async getUserProfile() {
        return this.makeRequest('/api/user/profile', { method: 'GET' });
    }

    async updateUserProfile(profileData) {
        return this.makeRequest('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async deleteUserProfile() {
        return this.makeRequest('/api/user/profile', { method: 'DELETE' });
    }

    // Stripe checkout
    async createCheckoutSession(priceId, billingCycle = 'monthly') {
        return this.makeRequest('/api/checkout/create-session', {
            method: 'POST',
            body: JSON.stringify({
                price_id: priceId,
                billing_cycle: billingCycle
            })
        });
    }
}

const backendApiService = new BackendApiService();
module.exports = backendApiService;