'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Briefcase, GraduationCap, Users, Coffee, MessageSquare } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getPresets, createPreset, updatePreset, deletePreset } from '@/utils/api';

interface Preset {
  id: string;
  title: string;
  prompt: string;
  is_default: number;
  created_at: number;
}

export default function PersonalizePage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    prompt: ''
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePreset = () => {
    setEditingPreset(null);
    setFormData({ title: '', prompt: '' });
    setShowModal(true);
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset);
    setFormData({ title: preset.title, prompt: preset.prompt });
    setShowModal(true);
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      try {
        await deletePreset(id);
        setPresets(presets.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting preset:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.prompt.trim()) return;

    try {
      if (editingPreset) {
        await updatePreset(editingPreset.id, formData);
        setPresets(presets.map(p => 
          p.id === editingPreset.id 
            ? { ...p, title: formData.title, prompt: formData.prompt }
            : p
        ));
      } else {
        const newPreset = await createPreset(formData);
        const presetData = {
          id: newPreset.id,
          title: formData.title,
          prompt: formData.prompt,
          is_default: 0,
          created_at: Date.now()
        };
        setPresets([...presets, presetData]);
      }
      setShowModal(false);
      setFormData({ title: '', prompt: '' });
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const getPresetIcon = (title: string) => {
    const lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.includes('school') || lowercaseTitle.includes('education')) {
      return GraduationCap;
    } else if (lowercaseTitle.includes('meeting') || lowercaseTitle.includes('business')) {
      return Briefcase;
    } else if (lowercaseTitle.includes('sales') || lowercaseTitle.includes('customer')) {
      return Users;
    } else if (lowercaseTitle.includes('casual') || lowercaseTitle.includes('personal')) {
      return Coffee;
    } else {
      return MessageSquare;
    }
  };

  const defaultPresets = [
    {
      id: 'school',
      title: 'School',
      prompt: 'You are an educational assistant. Help me with my studies, explain concepts clearly, and provide learning resources.',
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'meeting',
      title: 'Meeting',
      prompt: 'You are a professional meeting assistant. Help me prepare for meetings, take notes, and follow up on action items.',
      icon: Briefcase,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'sales',
      title: 'Sales',
      prompt: 'You are a sales assistant. Help me with client interactions, proposal writing, and sales strategy.',
      icon: Users,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'casual',
      title: 'Casual',
      prompt: 'You are a friendly conversational assistant. Keep responses casual, helpful, and engaging.',
      icon: Coffee,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading presets...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Personalize</h1>
            <p className="text-gray-600">Create context presets for different scenarios</p>
          </div>
          <button
            onClick={handleCreatePreset}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Preset</span>
          </button>
        </div>

        {/* Default Presets */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {defaultPresets.map((preset) => (
              <div key={preset.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-10 h-10 rounded-lg ${preset.color} flex items-center justify-center mb-3`}>
                  <preset.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{preset.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{preset.prompt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Presets */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Custom Presets</h2>
          
          {presets.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom presets yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first preset to customize the AI for specific contexts
              </p>
              <button
                onClick={handleCreatePreset}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Preset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => {
                const IconComponent = getPresetIcon(preset.title);
                return (
                  <div key={preset.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditPreset(preset)}
                          className="p-1 rounded text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{preset.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{preset.prompt}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPreset ? 'Edit Preset' : 'Create New Preset'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter preset title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter the prompt that will guide the AI's behavior"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.title.trim() || !formData.prompt.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingPreset ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 