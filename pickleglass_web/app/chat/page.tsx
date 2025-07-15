'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Image, Paperclip, Loader2, Bot, User } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { createSession, getSessionDetails } from '@/utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const session = await createSession('New Chat Session');
      setSessionId(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // TODO: Implement actual API call to backend
      // For now, simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `I understand you said: "${userMessage.content}". This is a simulated response. The actual AI integration will be implemented to connect to the backend API.`,
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat(aiResponse));
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        {message.role === 'user' ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Bot className="h-4 w-4 text-gray-600" />
        )}
      </div>
      
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        {message.isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <h1 className="text-xl font-semibold text-gray-900">AI Chat</h1>
          <p className="text-sm text-gray-600">
            Ask me anything or start a conversation
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600">
                Ask me anything or describe what you need help with.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button
                  onClick={toggleRecording}
                  className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                    isRecording ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}