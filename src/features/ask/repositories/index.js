const sqliteRepository = require('./sqlite.repository');
const backendApiService = require('../../common/services/backendApiService');
const authService = require('../../common/services/authService');

function getBaseRepository() {
    const user = authService.getCurrentUser();
    if (user && user.isLoggedIn) {
        // Use backend API service for authenticated users
        return {
            addAiMessage: async ({ uid, sessionId, role, content, model }) => {
                // AI messages are handled by the backend through the ask endpoint
                // This method is kept for compatibility but logs a warning
                console.warn('[AskRepository] addAiMessage is deprecated. Use backendApiService.sendAskRequest instead.');
                return { success: true };
            },
            getAllAiMessagesBySessionId: async (sessionId) => {
                try {
                    const messages = await backendApiService.getAskMessages(sessionId);
                    return messages;
                } catch (error) {
                    console.error('[AskRepository] Error fetching AI messages:', error);
                    return [];
                }
            }
        };
    }
    return sqliteRepository;
}

// The adapter layer that injects the UID
const askRepositoryAdapter = {
    addAiMessage: ({ sessionId, role, content, model }) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().addAiMessage({ uid, sessionId, role, content, model });
    },
    getAllAiMessagesBySessionId: (sessionId) => {
        return getBaseRepository().getAllAiMessagesBySessionId(sessionId);
    },
    
    // New method to use backend API for sending ask requests
    sendAskRequest: async (prompt, screenContext = null, audioTranscript = null) => {
        try {
            const response = await backendApiService.sendAskRequest(prompt, screenContext, audioTranscript);
            return response;
        } catch (error) {
            console.error('[AskRepository] Error sending ask request:', error);
            throw error;
        }
    }
};

module.exports = askRepositoryAdapter; 