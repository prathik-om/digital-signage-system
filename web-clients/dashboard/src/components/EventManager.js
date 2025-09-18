import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Edit, Trash2, Play, Pause } from 'lucide-react';
import config from '../config';

const EventManager = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_active: true
  });

  // Load mock events on component mount
  useEffect(() => {
    loadMockEvents();
  }, []);

  const loadMockEvents = () => {
    const mockEvents = [
      {
        ROWID: 1,
        title: 'Company All-Hands Meeting',
        description: 'Quarterly company meeting with important updates',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:30:00Z',
        location: 'Main Conference Room',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        ROWID: 2,
        title: 'Product Launch Event',
        description: 'Launching our new product line',
        start_time: '2024-01-20T14:00:00Z',
        end_time: '2024-01-20T16:00:00Z',
        location: 'Auditorium',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        ROWID: 3,
        title: 'Training Session',
        description: 'Employee training on new processes',
        start_time: '2024-01-25T09:00:00Z',
        end_time: '2024-01-25T12:00:00Z',
        location: 'Training Room B',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];
    setEvents(mockEvents);
  };

  // API calls (using mock data for now)
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to call the real API, but fall back to mock data if it fails
      const response = await fetch(`${config.API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll' })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvents(result.events || []);
        } else {
          throw new Error(result.message || 'Failed to fetch events');
        }
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.warn('Events API not available, using mock data:', error.message);
      loadMockEvents(); // Fall back to mock data
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      setError('Title, start time, and end time are required');
      return;
    }

    try {
      setError('');
      
      // Create new event with mock data
      const newEvent = {
        ROWID: Date.now(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location.trim(),
        is_active: formData.is_active,
        created_at: new Date().toISOString()
      };

      // Add to events list
      setEvents(prev => [newEvent, ...prev]);
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event: ' + error.message);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent?.ROWID) {
      setError('No event selected for editing');
      return;
    }

    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      setError('Title, start time, and end time are required');
      return;
    }

    try {
      setError('');
      
      // Update event in the list
      setEvents(prev => prev.map(event => 
        event.ROWID === editingEvent.ROWID 
          ? {
              ...event,
              title: formData.title.trim(),
              description: formData.description.trim(),
              start_time: formData.start_time,
              end_time: formData.end_time,
              location: formData.location.trim(),
              is_active: formData.is_active,
              updated_at: new Date().toISOString()
            }
          : event
      ));
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      setEditingEvent(null);
      
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      // Remove from events list
      setEvents(prev => prev.filter(event => event.ROWID !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event: ' + error.message);
    }
  };

  const toggleEventStatus = async (event) => {
    try {
      // Toggle status in the list
      setEvents(prev => prev.map(e => 
        e.ROWID === event.ROWID 
          ? { ...e, is_active: !e.is_active }
          : e
      ));
    } catch (error) {
      console.error('Error toggling event status:', error);
      setError('Failed to update event status: ' + error.message);
    }
  };

  // Form management
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      is_active: true
    });
    setError('');
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      start_time: event.start_time ? event.start_time.slice(0, 16) : '', // Format for datetime-local input
      end_time: event.end_time ? event.end_time.slice(0, 16) : '',
      location: event.location || '',
      is_active: event.is_active !== undefined ? event.is_active : true
    });
    setShowCreateModal(true);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600' : 'text-gray-500';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
        <p className="text-gray-600">
          Manage events and schedule content for your digital signage displays
        </p>
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={fetchEvents}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Refresh Events
          </button>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingEvent(null);
            setShowCreateModal(true);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Events ({events.length})</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No events found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingEvent(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.ROWID} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                      <span className={`text-sm font-medium ${getStatusColor(event.is_active)}`}>
                        {getStatusText(event.is_active)}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Start: {formatDateTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>End: {formatDateTime(event.end_time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleEventStatus(event)}
                      className={`p-2 rounded-lg transition-colors ${
                        event.is_active
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={event.is_active ? 'Deactivate event' : 'Activate event'}
                    >
                      {event.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit event"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.ROWID)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter event title"
                />
              </div>

              {/* Event Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Enter event description"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter event location"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Event is active
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Active events will be visible in the system
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;