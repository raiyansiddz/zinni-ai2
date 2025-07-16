const axios = require('axios');
const neonAuthService = require('./neonAuthService');
const config = require('../../../config/environment');

class BackendApiService {
    constructor() {
        this.baseUrl = config.BACKEND_URL;
        
        // Create axios instance with base configuration
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Add request interceptor to inject auth token
        this.axiosInstance.interceptors.request.use((config) => {
            const token = neonAuthService.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        
        // Add response interceptor to handle auth errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired, clear session
                    neonAuthService.clearSession();
                    neonAuthService.broadcastUserState();
                }
                return Promise.reject(error);
            }
        );
        
        console.log('[BackendApiService] Service initialized with base URL:', this.baseUrl);
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await this.axiosInstance.request({
                url: endpoint,
                ...options
            });
            return response.data;
        } catch (error) {
            console.error(`[BackendApiService] Request to ${endpoint} failed:`, error.message);
            
            // Handle specific error types
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || error.response.data?.error || `Request failed: ${error.response.status}`;
                throw new Error(errorMessage);
            } else if (error.request) {
                // No response received
                throw new Error('No response from server. Please check your connection.');
            } else {
                // Other error
                throw new Error(error.message || 'Unknown error occurred');
            }
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
            data: {
                prompt,
                screen_context: screenContext,
                audio_transcript: audioTranscript
            }
        });
    }

    async getAskMessages(sessionId) {
        return this.makeRequest(`/api/ask/messages`, { 
            method: 'GET',
            params: { session_id: sessionId }
        });
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
            data: {
                action_type: actionType,
                resource_used: resourceUsed,
                quantity
            }
        });
    }

    async getUsageSessions() {
        return this.makeRequest('/api/track/sessions', { method: 'GET' });
    }

    async getSessionUsage(sessionId) {
        return this.makeRequest(`/api/track/session`, { 
            method: 'GET',
            params: { session_id: sessionId }
        });
    }

    // User profile
    async getUserProfile() {
        return this.makeRequest('/api/user/profile', { method: 'GET' });
    }

    async updateUserProfile(profileData) {
        return this.makeRequest('/api/user/profile', {
            method: 'PUT',
            data: profileData
        });
    }

    async deleteUserProfile() {
        return this.makeRequest('/api/user/profile', { method: 'DELETE' });
    }

    // Stripe checkout
    async createCheckoutSession(priceId, billingCycle = 'monthly') {
        return this.makeRequest('/api/checkout/create-session', {
            method: 'POST',
            data: {
                price_id: priceId,
                billing_cycle: billingCycle
            }
        });
    }
}

const backendApiService = new BackendApiService();
module.exports = backendApiService;