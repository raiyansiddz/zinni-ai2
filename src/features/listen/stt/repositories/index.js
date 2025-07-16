const sqliteRepository = require('./sqlite.repository');
const backendApiService = require('../../../common/services/backendApiService');
const authService = require('../../../common/services/authService');

function getBaseRepository() {
    const user = authService.getCurrentUser();
    if (user && user.isLoggedIn) {
        // Use backend API service for authenticated users
        return {
            addTranscript: async ({ uid, sessionId, speaker, text }) => {
                // Transcripts are handled by the backend through the tracking endpoint
                // This method is kept for compatibility but logs a warning
                console.warn('[STTRepository] addTranscript is deprecated. Use backendApiService.trackUsage instead.');
                return { success: true };
            },
            getAllTranscriptsBySessionId: async (sessionId) => {
                try {
                    // For now, return empty array as transcripts are handled differently in backend
                    console.warn('[STTRepository] getAllTranscriptsBySessionId for backend not implemented yet');
                    return [];
                } catch (error) {
                    console.error('[STTRepository] Error fetching transcripts:', error);
                    return [];
                }
            }
        };
    }
    return sqliteRepository;
}

const sttRepositoryAdapter = {
    addTranscript: ({ sessionId, speaker, text }) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().addTranscript({ uid, sessionId, speaker, text });
    },
    getAllTranscriptsBySessionId: (sessionId) => {
        return getBaseRepository().getAllTranscriptsBySessionId(sessionId);
    }
};

module.exports = sttRepositoryAdapter; 