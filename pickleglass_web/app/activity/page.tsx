'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Calendar, Filter, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getSessions, deleteSession, getSessionDetails } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function ActivityPage() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const filtered = sessions.filter(session =>
      session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.session_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [sessions, searchQuery]);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      setFilteredSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      const details = await getSessionDetails(sessionId);
      setSelectedSession(details);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading session details:', error);
    }
  };

  const SessionCard = ({ session }) => (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {session.title || 'Untitled Session'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {session.session_type || 'chat'} • {new Date(session.started_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Started: {new Date(session.started_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewSession(session.id)}
            className="p-1 rounded text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteSession(session.id)}
            className="p-1 rounded text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Activity</h1>
            <p className="text-gray-600">View and manage your AI conversation sessions</p>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Chat
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 border text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Start your first AI conversation'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Session Details Modal */}
        {showDetails && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedSession.session.title || 'Session Details'}
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* Session Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Session Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {selectedSession.session.session_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Started:</span> {new Date(selectedSession.session.started_at).toLocaleString()}
                      </p>
                      {selectedSession.session.ended_at && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Ended:</span> {new Date(selectedSession.session.ended_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Messages */}
                  {selectedSession.ai_messages && selectedSession.ai_messages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        AI Messages ({selectedSession.ai_messages.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedSession.ai_messages.map((message, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                                }`}>
                                  {message.role === 'user' ? '👤' : '🤖'}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">
                                  {message.role === 'user' ? 'You' : 'AI'} • {new Date(message.created_at).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-900">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedSession.summary && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-900">{selectedSession.summary.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  ); 