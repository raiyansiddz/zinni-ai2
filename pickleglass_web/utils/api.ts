import { useUser } from '@stackframe/stack'

export interface UserProfile {
  uid: string;
  display_name: string;
  email: string;
}

export interface Session {
  id: string;
  uid: string;
  title: string;
  session_type: string;
  started_at: number;
  ended_at?: number;
  sync_state: 'clean' | 'dirty';
  updated_at: number;
}

export interface Transcript {
  id: string;
  session_id: string;
  start_at: number;
  end_at?: number;
  speaker?: string;
  text: string;
  lang?: string;
  created_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface AiMessage {
  id: string;
  session_id: string;
  sent_at: number;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  model?: string;
  created_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface Summary {
  session_id: string;
  generated_at: number;
  model?: string;
  text: string;
  tldr: string;
  bullet_json: string;
  action_json: string;
  tokens_used?: number;
  updated_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface PromptPreset {
  id: string;
  uid: string;
  title: string;
  prompt: string;
  is_default: 0 | 1;
  created_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface SessionDetails {
    session: Session;
    transcripts: Transcript[];
    ai_messages: AiMessage[];
    summary: Summary | null;
}

export interface BatchData {
    profile?: UserProfile;
    presets?: PromptPreset[];
    sessions?: Session[];
}

// API Origin Configuration
const API_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// User Info Management
const userInfoListeners: Array<(userInfo: UserProfile | null) => void> = [];

export const getUserInfo = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  
  const storedUserInfo = localStorage.getItem('glass_user');
  if (storedUserInfo) {
    try {
      return JSON.parse(storedUserInfo);
    } catch (error) {
      console.error('Failed to parse user info:', error);
      localStorage.removeItem('glass_user');
    }
  }
  return null;
};

export const setUserInfo = (userInfo: UserProfile | null, skipEvents: boolean = false) => {
  if (typeof window === 'undefined') return;
  
  if (userInfo) {
    localStorage.setItem('glass_user', JSON.stringify(userInfo));
  } else {
    localStorage.removeItem('glass_user');
  }
  
  if (!skipEvents) {
    userInfoListeners.forEach(listener => listener(userInfo));
    window.dispatchEvent(new Event('userInfoChanged'));
  }
};

export const onUserInfoChange = (listener: (userInfo: UserProfile | null) => void) => {
  userInfoListeners.push(listener);
  
  return () => {
    const index = userInfoListeners.indexOf(listener);
    if (index > -1) {
      userInfoListeners.splice(index, 1);
    }
  };
};

// API Headers with Authentication
export const getApiHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // For Stack Auth, we'll handle tokens in the components that call the API
  // For now, use the fallback user ID header for local mode
  const userInfo = getUserInfo();
  if (userInfo?.uid) {
    headers['X-User-ID'] = userInfo.uid;
  }
  
  return headers;
};

// API Call Helper
export const apiCall = async (path: string, options: RequestInit = {}) => {
  const url = `${API_ORIGIN}${path}`;
  console.log('🌐 API Call:', {
    path,
    API_ORIGIN,
    fullUrl: url,
    method: options.method || 'GET'
  });
  
  const headers = getApiHeaders();
  
  const defaultOpts: RequestInit = {
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
    ...options,
  };
  
  const response = await fetch(url, defaultOpts);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  return response;
};

// Authentication APIs
export const findOrCreateUser = async (user: UserProfile): Promise<UserProfile> => {
  try {
    const response = await apiCall('/api/auth/me', {
      method: 'GET',
    });
    
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.log('User not found, creating new user');
  }
  
  // If user doesn't exist, create them
  const createResponse = await apiCall('/api/user/profile', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  
  return createResponse.json();
};

// Session Management
export const searchConversations = async (query: string): Promise<Session[]> => {
  if (!query.trim()) {
    return [];
  }

  const response = await apiCall(`/api/track/sessions?search=${encodeURIComponent(query)}`);
  return response.json();
};

export const getSessions = async (): Promise<Session[]> => {
  const response = await apiCall('/api/track/sessions');
  return response.json();
};

export const getSessionDetails = async (sessionId: string): Promise<SessionDetails> => {
  const response = await apiCall(`/api/track/sessions/${sessionId}`);
  return response.json();
};

export const createSession = async (title?: string): Promise<{ id: string }> => {
  const response = await apiCall('/api/track/', {
    method: 'POST',
    body: JSON.stringify({ 
      action_type: 'session_start',
      session_title: title || 'New Session'
    }),
  });
  return response.json();
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await apiCall(`/api/track/sessions/${sessionId}`, { 
    method: 'DELETE' 
  });
};

// User Profile Management
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiCall('/api/user/profile');
  return response.json();
};

export const updateUserProfile = async (data: { displayName: string }): Promise<void> => {
  await apiCall('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ display_name: data.displayName }),
  });
};

export const deleteAccount = async (): Promise<void> => {
  await apiCall('/api/user/profile', { method: 'DELETE' });
};

// API Key Management
export const saveApiKey = async (apiKey: string): Promise<void> => {
  await apiCall('/api/admin/api-keys', {
    method: 'POST',
    body: JSON.stringify({ provider: 'openai', api_key: apiKey }),
  });
};

export const checkApiKeyStatus = async (): Promise<{ hasApiKey: boolean }> => {
  try {
    const response = await apiCall('/api/admin/api-keys');
    const keys = await response.json();
    return { hasApiKey: keys.length > 0 };
  } catch (error) {
    return { hasApiKey: false };
  }
};

// Prompt Presets
export const getPresets = async (): Promise<PromptPreset[]> => {
  // This would need to be implemented in the backend
  // For now, return empty array
  return [];
};

export const createPreset = async (data: { title: string, prompt: string }): Promise<{ id: string }> => {
  // This would need to be implemented in the backend
  throw new Error('Presets not implemented in backend yet');
};

export const updatePreset = async (id: string, data: { title: string, prompt: string }): Promise<void> => {
  // This would need to be implemented in the backend
  throw new Error('Presets not implemented in backend yet');
};

export const deletePreset = async (id: string): Promise<void> => {
  // This would need to be implemented in the backend
  throw new Error('Presets not implemented in backend yet');
};

// Batch Data
export const getBatchData = async (includes: ('profile' | 'presets' | 'sessions')[]): Promise<BatchData> => {
  const result: BatchData = {};
  
  const promises: Promise<any>[] = [];
  
  if (includes.includes('profile')) {
    promises.push(getUserProfile().then(profile => ({ type: 'profile', data: profile })));
  }
  if (includes.includes('presets')) {
    promises.push(getPresets().then(presets => ({ type: 'presets', data: presets })));
  }
  if (includes.includes('sessions')) {
    promises.push(getSessions().then(sessions => ({ type: 'sessions', data: sessions })));
  }
  
  const results = await Promise.all(promises);
  
  results.forEach(({ type, data }) => {
    result[type as keyof BatchData] = data;
  });
  
  return result;
};

// Logout
export const logout = async () => {
  // Stack Auth logout will be handled in the components
  setUserInfo(null);
  
  // Clear local storage
  localStorage.removeItem('glass_user');
  localStorage.removeItem('openai_api_key');
  localStorage.removeItem('user_info');
  
  window.location.href = '/login';
}; 