const sqliteRepository = require('./sqlite.repository');
const backendApiService = require('../../../common/services/backendApiService');
const authService = require('../../../common/services/authService');

function getBaseRepository() {
    const user = authService.getCurrentUser();
    if (user && user.isLoggedIn) {
        // Use backend API service for authenticated users
        return {
            saveSummary: async ({ uid, sessionId, tldr, text, bullet_json, action_json, model }) => {
                // Summaries are handled by the backend through the tracking endpoint
                // This method is kept for compatibility but logs a warning
                console.warn('[SummaryRepository] saveSummary is deprecated. Use backendApiService.trackUsage instead.');
                return { success: true };
            },
            getSummaryBySessionId: async (sessionId) => {
                try {
                    // For now, return empty object as summaries are handled differently in backend
                    console.warn('[SummaryRepository] getSummaryBySessionId for backend not implemented yet');
                    return null;
                } catch (error) {
                    console.error('[SummaryRepository] Error fetching summary:', error);
                    return null;
                }
            }
        };
    }
    return sqliteRepository;
}

const summaryRepositoryAdapter = {
    saveSummary: ({ sessionId, tldr, text, bullet_json, action_json, model }) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().saveSummary({ uid, sessionId, tldr, text, bullet_json, action_json, model });
    },
    getSummaryBySessionId: (sessionId) => {
        return getBaseRepository().getSummaryBySessionId(sessionId);
    }
};

module.exports = summaryRepositoryAdapter; 