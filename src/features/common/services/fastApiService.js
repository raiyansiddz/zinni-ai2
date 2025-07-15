const fetch = require('node-fetch');
const neonAuthService = require('./neonAuthService');

class FastApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8002';
        console.log('[FastApiService] Service initialized with base URL:', this.baseUrl);
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const authToken = neonAuthService.getAuthToken();
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (authToken) {
            defaultHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            console.log(`[FastApiService] Making request to: ${url}`);
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`[FastApiService] Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // User APIs
    async getUserProfile() {
        return await this.makeRequest('/api/user/profile');
    }

    async updateUserProfile(updates) {
        return await this.makeRequest('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    // AI APIs
    async askAI(prompt, screenContext = null, audioTranscript = null, sessionId = null) {
        const payload = {
            prompt,
            screen_context: screenContext,
            audio_transcript: audioTranscript,
            session_id: sessionId,
            provider: 'gemini' // Default to Gemini
        };

        return await this.makeRequest('/api/ask/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getAiMessages(sessionId, limit = 50, offset = 0) {
        const params = new URLSearchParams({
            session_id: sessionId,
            limit: limit.toString(),
            offset: offset.toString()
        });

        return await this.makeRequest(`/api/ask/messages?${params}`);
    }

    async getAvailableProviders() {
        return await this.makeRequest('/api/ask/providers');
    }

    // Session APIs
    async createSession(title = null, sessionType = 'ask') {
        const payload = {
            title,
            session_type: sessionType
        };

        return await this.makeRequest('/api/track/session', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getUserSessions(limit = 50, offset = 0) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        return await this.makeRequest(`/api/track/sessions?${params}`);
    }

    async endSession(sessionId) {
        return await this.makeRequest(`/api/track/session/${sessionId}/end`, {
            method: 'PUT',
        });
    }

    // Plan APIs
    async getAvailablePlans() {
        return await this.makeRequest('/api/plan/');
    }

    async getCurrentPlan() {
        return await this.makeRequest('/api/plan/current');
    }

    async getUsageInfo() {
        return await this.makeRequest('/api/plan/usage');
    }

    // Stripe APIs
    async createCheckoutSession(planType, billingPeriod = 'monthly') {
        const payload = {
            plan_type: planType,
            billing_period: billingPeriod,
            success_url: 'pickleglass://payment-success',
            cancel_url: 'pickleglass://payment-cancel'
        };

        return await this.makeRequest('/api/checkout/create-session', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Usage tracking
    async trackUsage(actionType, resourceUsed = null, quantity = 1) {
        const payload = {
            action_type: actionType,
            resource_used: resourceUsed,
            quantity
        };

        return await this.makeRequest('/api/track/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Health check
    async checkHealth() {
        return await this.makeRequest('/health');
    }
}

const fastApiService = new FastApiService();
module.exports = fastApiService;