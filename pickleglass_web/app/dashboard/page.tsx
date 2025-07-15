'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Activity, Settings, User, CreditCard, Bell, TrendingUp, Clock, Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserInfo, getSessions, getUserProfile } from '@/utils/api';

interface DashboardStats {
  totalSessions: number;
  totalMessages: number;
  monthlyUsage: number;
  planType: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalMessages: 0,
    monthlyUsage: 0,
    planType: 'free'
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userInfo = getUserInfo();
        if (!userInfo) return;

        setUser(userInfo);

        // Load recent sessions
        const sessions = await getSessions();
        setRecentSessions(sessions.slice(0, 5));

        // Calculate stats
        setStats({
          totalSessions: sessions.length,
          totalMessages: sessions.reduce((acc, session) => acc + (session.message_count || 0), 0),
          monthlyUsage: Math.floor(Math.random() * 100), // Mock data
          planType: 'free' // Mock data
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a new AI conversation',
      icon: MessageSquare,
      color: 'bg-blue-500',
      href: '/chat'
    },
    {
      title: 'View Activity',
      description: 'See your recent sessions',
      icon: Activity,
      color: 'bg-green-500',
      href: '/activity'
    },
    {
      title: 'Settings',
      description: 'Manage your preferences',
      icon: Settings,
      color: 'bg-purple-500',
      href: '/settings'
    },
    {
      title: 'Billing',
      description: 'Manage your subscription',
      icon: CreditCard,
      color: 'bg-yellow-500',
      href: '/settings/billing'
    }
  ];

  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Messages Sent',
      value: stats.totalMessages,
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Monthly Usage',
      value: `${stats.monthlyUsage}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Current Plan',
      value: stats.planType.charAt(0).toUpperCase() + stats.planType.slice(1),
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.display_name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your AI assistant today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 border">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => window.location.href = action.href}
                className="p-4 rounded-lg border hover:shadow-md transition-shadow text-left"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <button
              onClick={() => window.location.href = '/activity'}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sessions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start your first AI conversation to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session, index) => (
                <div key={session.id || index} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {session.title || 'Untitled Session'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.session_type || 'chat'} • {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}