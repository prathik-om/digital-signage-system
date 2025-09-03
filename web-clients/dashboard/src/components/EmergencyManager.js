import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Clock,
  Send,
  X,
  AlertCircle
} from 'lucide-react';

const EmergencyManager = ({ user }) => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    priority: 'high',
    duration: 30
  });

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      // Mock data - in real app, this would be an API call
      setEmergencies([
        {
          id: 1,
          message: 'Fire alarm test - please evacuate building',
          priority: 'high',
          duration: 60,
          is_active: true,
          created_at: '2024-01-15T14:30:00Z',
          created_by: 'admin@example.com'
        },
        {
          id: 2,
          message: 'Maintenance in progress - elevator temporarily unavailable',
          priority: 'medium',
          duration: 30,
          is_active: false,
          created_at: '2024-01-15T10:15:00Z',
          created_by: 'admin@example.com'
        }
      ]);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmergency = async () => {
    if (!formData.message) return;

    try {
      const newEmergency = {
        id: Date.now(),
        message: formData.message,
        priority: formData.priority,
        duration: formData.duration,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: user.email
      };

      setEmergencies(prev => [newEmergency, ...prev]);
      setShowCreateModal(false);
      setFormData({ message: '', priority: 'high', duration: 30 });
    } catch (error) {
      console.error('Error creating emergency:', error);
    }
  };

  const handleDeactivateEmergency = async (emergencyId) => {
    try {
      setEmergencies(prev => prev.map(emergency => 
        emergency.id === emergencyId 
          ? { ...emergency, is_active: false }
          : emergency
      ));
    } catch (error) {
      console.error('Error deactivating emergency:', error);
    }
  };

  const handleDeleteEmergency = async (emergencyId) => {
    if (window.confirm('Are you sure you want to delete this emergency message?')) {
      try {
        setEmergencies(prev => prev.filter(emergency => emergency.id !== emergencyId));
      } catch (error) {
        console.error('Error deleting emergency:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all emergency messages?')) {
      try {
        setEmergencies(prev => prev.map(emergency => ({ ...emergency, is_active: false })));
      } catch (error) {
        console.error('Error clearing emergencies:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'emergency-high';
      case 'medium':
        return 'emergency-medium';
      case 'low':
        return 'emergency-low';
      default:
        return 'emergency-high';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeEmergencies = emergencies.filter(emergency => emergency.is_active);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Manager</h1>
          <p className="text-gray-600">Manage emergency messages and alerts</p>
        </div>
        <div className="flex space-x-3">
          {activeEmergencies.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-danger flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Emergency
          </button>
        </div>
      </div>

      {/* Active Emergency Alert */}
      {activeEmergencies.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-medium text-red-900">Active Emergency Messages</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {activeEmergencies.length} emergency message(s) currently being displayed
          </p>
        </div>
      )}

      {/* Emergency Messages */}
      <div className="space-y-4">
        {emergencies.map((emergency) => (
          <div key={emergency.id} className={`dashboard-card border-l-4 ${
            emergency.is_active ? 'border-red-500' : 'border-gray-300'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getPriorityIcon(emergency.priority)}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    getPriorityColor(emergency.priority)
                  }`}>
                    {emergency.priority.toUpperCase()}
                  </span>
                  {emergency.is_active && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ACTIVE
                    </span>
                  )}
                </div>
                
                <p className="text-gray-900 mb-2">{emergency.message}</p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {emergency.duration}s duration • Created {new Date(emergency.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                {emergency.is_active ? (
                  <button
                    onClick={() => handleDeactivateEmergency(emergency.id)}
                    className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                    title="Deactivate"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeactivateEmergency(emergency.id)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Activate"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteEmergency(emergency.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Emergency Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Emergency Message</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter emergency message..."
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input-field"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEmergency}
                  disabled={!formData.message}
                  className="btn-danger"
                >
                  Send Emergency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyManager; 