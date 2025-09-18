import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, Settings, Save, X, AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users, Building } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/en-gb';
import { API_BASE_URL, API_ENDPOINTS } from '../config';

// Enhanced API service for events and playlists
const eventAPI = {
  async createEventWithPlaylist(eventData) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.playlist}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'createEventWithPlaylist',
          event: eventData
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Event creation error:', error);
      return { success: false, message: 'Failed to create event: ' + error.message };
    }
  },

  async getEvents() {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.content}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'getAllEvents'
        })
      });
      
      const result = await response.json();
      return result.success ? result.events : [];
    } catch (error) {
      console.error('Events fetch error:', error);
      return [];
    }
  }
};

const ScheduleManager = ({ playlists, onScheduleUpdate }) => {
  const [schedules, setSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [validation, setValidation] = useState({ errors: [], warnings: [] });
  const [successMessage, setSuccessMessage] = useState('');
  const [currentWeek, setCurrentWeek] = useState(moment().startOf('week'));
  const [viewMode, setViewMode] = useState('defaults'); // 'defaults' or 'events'

  // Helper functions
  const getDayNames = () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const formatTime = (time) => {
    if (!time) return '';
    return moment(time, 'HH:mm:ss').format('HH:mm');
  };

  const formatDate = (date) => {
    if (!date) return '';
    return moment(date).format('MMM D, YYYY');
  };

  const getScheduleStatus = (schedule) => {
    if (!schedule || !schedule.enabled) return 'disabled';
    
    const now = moment();
    
    if (schedule.type === 'event' && schedule.startDate && schedule.endDate) {
      // For date-based events
      const startDateTime = moment(`${schedule.startDate} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm:ss');
      const endDateTime = moment(`${schedule.endDate} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm:ss');
      
      if (now.isBetween(startDateTime, endDateTime)) return 'active';
      if (now.isBefore(startDateTime)) return 'upcoming';
      return 'completed';
    } else {
      // For default schedules (time-based)
      const startTime = moment(schedule.startTime, 'HH:mm:ss');
      const endTime = moment(schedule.endTime, 'HH:mm:ss');
      
      if (now.isBetween(startTime, endTime)) return 'active';
      if (now.isBefore(startTime)) return 'upcoming';
      return 'completed';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(currentWeek.clone().add(i, 'days'));
    }
    return days;
  };

  const getWeekRange = () => {
    const start = currentWeek.format('MMM D');
    const end = currentWeek.clone().endOf('week').format('MMM D, YYYY');
    return `${start} - ${end}`;
  };

  // Get default playlist for a specific day
  const getDefaultPlaylist = (dayNumber) => {
    return schedules.find(schedule => 
      schedule.type === 'default' && 
      schedule.days && schedule.days.includes(dayNumber) &&
      schedule.enabled
    );
  };

  // Get special events for a specific date
  const getSpecialEvents = (date) => {
    return schedules.filter(schedule => 
      schedule.type === 'event' && 
      schedule.enabled &&
      schedule.startDate && schedule.endDate &&
      moment(date).isBetween(schedule.startDate, schedule.endDate, 'day', '[]') // Inclusive
    );
  };

  // Validation for default schedules
  const validateDefaultSchedule = useCallback((schedule) => {
    const errors = [];
    const warnings = [];

    if (!schedule.startTime || !schedule.endTime) {
      errors.push('Start and end times are required');
    }

    if (schedule.startTime && schedule.endTime) {
      const start = moment(schedule.startTime, 'HH:mm:ss');
      const end = moment(schedule.endTime, 'HH:mm:ss');
      
      if (start.isSameOrAfter(end)) {
        errors.push('End time must be after start time');
      }
    }

    if (!schedule.days || schedule.days.length === 0) {
      errors.push('At least one day must be selected');
    }

    // Check for multiple default schedules on same day
    const conflictingDefaults = schedules.filter(s => 
      s.type === 'default' && 
      s.enabled && 
      s.playlistId !== schedule.playlistId &&
      s.days && schedule.days && s.days.some(day => schedule.days.includes(day))
    );

    if (conflictingDefaults.length > 0) {
      errors.push(`Multiple default playlists for same day: ${conflictingDefaults.map(c => c.playlistName).join(', ')}`);
    }

    return { errors, warnings };
  }, [schedules]);

  // Validation for event schedules
  const validateEventSchedule = useCallback((schedule) => {
    const errors = [];
    const warnings = [];

    if (!schedule.startTime || !schedule.endTime) {
      errors.push('Start and end times are required');
    }

    if (!schedule.startDate || !schedule.endDate) {
      errors.push('Start and end dates are required');
    }

    if (schedule.startTime && schedule.endTime) {
      const start = moment(schedule.startTime, 'HH:mm:ss');
      const end = moment(schedule.endTime, 'HH:mm:ss');
      
      if (start.isSameOrAfter(end)) {
        errors.push('End time must be after start time');
      }
    }

    if (schedule.startDate && schedule.endDate) {
      const startDate = moment(schedule.startDate);
      const endDate = moment(schedule.endDate);
      
      if (startDate.isAfter(endDate)) {
        errors.push('End date must be after start date');
      }
    }

    if (!schedule.eventName) {
      errors.push('Event name is required');
    }

    // Check for overlapping events on same date
    const overlappingEvents = schedules.filter(s => 
      s.type === 'event' && 
      s.enabled && 
      s.playlistId !== schedule.playlistId &&
      s.startDate && s.endDate && schedule.startDate && schedule.endDate
    ).filter(s => {
      const sStart = moment(s.startDate);
      const sEnd = moment(s.endDate);
      const newStart = moment(schedule.startDate);
      const newEnd = moment(schedule.endDate);
      
      // Check date overlap
      const hasDateOverlap = newStart.isSameOrBefore(sEnd) && newEnd.isSameOrAfter(sStart);
      
      if (hasDateOverlap && s.startTime && s.endTime && schedule.startTime && schedule.endTime) {
        // Check time overlap for overlapping dates
        const sStartTime = moment(s.startTime, 'HH:mm:ss');
        const sEndTime = moment(s.endTime, 'HH:mm:ss');
        const newStartTime = moment(schedule.startTime, 'HH:mm:ss');
        const newEndTime = moment(schedule.endTime, 'HH:mm:ss');
        
        return newStartTime.isBefore(sEndTime) && newEndTime.isAfter(sStartTime);
      }
      
      return hasDateOverlap;
    });

    if (overlappingEvents.length > 0) {
      errors.push(`Event overlaps with: ${overlappingEvents.map(e => e.eventName).join(', ')}`);
    }

    return { errors, warnings };
  }, [schedules]);

  const handleScheduleUpdate = useCallback(async (playlistId, scheduleData) => {
    console.log('🎯 [ScheduleManager] Starting schedule update...');
    console.log('🎯 [ScheduleManager] Playlist ID:', playlistId);
    console.log('🎯 [ScheduleManager] Schedule Data:', JSON.stringify(scheduleData, null, 2));
    
    try {
      // Validate based on schedule type
      const validation = scheduleData.type === 'default' 
        ? validateDefaultSchedule(scheduleData)
        : validateEventSchedule(scheduleData);

      console.log('🎯 [ScheduleManager] Validation result:', validation);

      if (validation.errors.length > 0) {
        console.log('🎯 [ScheduleManager] Validation failed:', validation.errors);
        setValidation(validation);
        return;
      }

      console.log('🎯 [ScheduleManager] Sending request to proxy...');
      const requestBody = {
        action: 'updateSchedule',
        playlist_id: playlistId,
        schedule: scheduleData
      };
      console.log('🎯 [ScheduleManager] Request body:', JSON.stringify(requestBody, null, 2));

      // Use production API for playlist functions
      const response = await fetch(`${window.location.origin}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ data: requestBody })
      });

      console.log('🎯 [ScheduleManager] Response status:', response.status);
      console.log('🎯 [ScheduleManager] Response ok:', response.ok);

      if (!response.ok) {
        console.log('🎯 [ScheduleManager] HTTP error:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎯 [ScheduleManager] Response result:', JSON.stringify(result, null, 2));
      
      if (result.success === true) {
        console.log('🎯 [ScheduleManager] Success! Setting success message...');
        setSchedules(prev => prev.map(s => 
          s.playlistId === playlistId 
            ? { ...s, ...scheduleData }
            : s
        ));
        setEditingSchedule(null);
        setValidation({ errors: [], warnings: [] });
        
        // Show success message
        const successMsg = result.message || 'Schedule updated successfully!';
        console.log('🎯 [ScheduleManager] Setting success message:', successMsg);
        setSuccessMessage(successMsg);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          console.log('🎯 [ScheduleManager] Clearing success message');
          setSuccessMessage('');
        }, 3000);
        
        if (onScheduleUpdate) {
          console.log('🎯 [ScheduleManager] Calling onScheduleUpdate callback');
          onScheduleUpdate();
        }
      } else {
        console.log('🎯 [ScheduleManager] Response success is not true:', result.success);
        throw new Error(result.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('🎯 [ScheduleManager] Error updating schedule:', error);
      setValidation({
        errors: [`Failed to update schedule: ${error.message}`],
        warnings: []
      });
      setSuccessMessage('');
    }
  }, [onScheduleUpdate, validateDefaultSchedule, validateEventSchedule]);

  // Initialize schedules from playlists
  useEffect(() => {
    const playlistSchedules = playlists
      .filter(playlist => playlist.schedule && typeof playlist.schedule === 'object')
      .map(playlist => ({
        playlistId: playlist.ROWID,
        playlistName: playlist.name,
        type: playlist.schedule.type || 'default',
        eventName: playlist.schedule.eventName || '',
        startDate: playlist.schedule.startDate || '',
        endDate: playlist.schedule.endDate || '',
        ...playlist.schedule
      }));
    setSchedules(playlistSchedules);
  }, [playlists]);

  // Re-validate when schedules change
  useEffect(() => {
    if (editingSchedule) {
      const validation = editingSchedule.type === 'default' 
        ? validateDefaultSchedule(editingSchedule)
        : validateEventSchedule(editingSchedule);
      setValidation(validation);
    }
  }, [editingSchedule, validateDefaultSchedule, validateEventSchedule]);

  const handleEdit = (schedule) => {
    setEditingSchedule({ ...schedule });
    setValidation({ errors: [], warnings: [] });
    setSuccessMessage('');
  };

  const handleSave = () => {
    console.log('🎯 [ScheduleManager] handleSave called');
    console.log('🎯 [ScheduleManager] editingSchedule:', editingSchedule);
    if (editingSchedule) {
      console.log('🎯 [ScheduleManager] Calling handleScheduleUpdate...');
      handleScheduleUpdate(editingSchedule.playlistId, editingSchedule);
    } else {
      console.log('🎯 [ScheduleManager] No editingSchedule, cannot save');
    }
  };

  const handleCancel = () => {
    setEditingSchedule(null);
    setValidation({ errors: [], warnings: [] });
    setSuccessMessage('');
  };

  const updateEditingSchedule = (field, value) => {
    setEditingSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDay = (dayNumber) => {
    if (!editingSchedule) return;
    
    const currentDays = editingSchedule.days || [];
    const newDays = currentDays.includes(dayNumber)
      ? currentDays.filter(d => d !== dayNumber)
      : [...currentDays, dayNumber].sort();
    
    updateEditingSchedule('days', newDays);
  };

  const getDayLabel = (dayNumber) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayNumber - 1] || '';
  };

  const getDayClass = (dayNumber) => {
    if (!editingSchedule) return '';
    const isSelected = editingSchedule.days?.includes(dayNumber);
    return isSelected 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  const getDefaultSchedules = () => schedules.filter(s => s.type === 'default');
  const getEventSchedules = () => schedules.filter(s => s.type === 'event');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600 mt-1">Default daily playlists and date-based special events</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Meeting space optimized scheduling</span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('defaults')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            viewMode === 'defaults' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Default Schedules</span>
        </button>
        <button
          onClick={() => setViewMode('events')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            viewMode === 'events' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Special Events</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Schedule List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'defaults' ? 'Default Daily Playlists' : 'Special Events'}
              </h3>
              <button
                onClick={() => {
                  const newSchedule = {
                    playlistId: 'new',
                    playlistName: 'New Schedule',
                    type: viewMode === 'defaults' ? 'default' : 'event',
                    enabled: true,
                    startTime: '09:00:00',
                    endTime: '17:00:00',
                    days: viewMode === 'defaults' ? [1, 2, 3, 4, 5] : [],
                    eventName: viewMode === 'events' ? 'New Event' : '',
                    startDate: viewMode === 'events' ? moment().format('YYYY-MM-DD') : '',
                    endDate: viewMode === 'events' ? moment().format('YYYY-MM-DD') : '',
                    timezone: 'UTC'
                  };
                  setEditingSchedule(newSchedule);
                }}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {viewMode === 'defaults' ? (
              // Default Schedules
              getDefaultSchedules().length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No default schedules configured</p>
                  <p className="text-sm text-gray-400 mt-1">Set up daily playlists for regular operations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getDefaultSchedules().map((schedule) => {
                    const status = getScheduleStatus(schedule);
                    return (
                      <div
                        key={schedule.playlistId}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          editingSchedule?.playlistId === schedule.playlistId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleEdit(schedule)}
                      >
                        <div className="flex items-start justify-between">
              <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {schedule.playlistName}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-2">
                              {schedule.days?.map(day => (
                                <span
                                  key={day}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded"
                                >
                                  {getDayLabel(day)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status}
                  </span>
                            {schedule.enabled ? (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            ) : (
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Event Schedules
              getEventSchedules().length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No special events scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">Add client meetings and special events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getEventSchedules().map((schedule) => {
                    const status = getScheduleStatus(schedule);
                    return (
                      <div
                        key={schedule.playlistId}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          editingSchedule?.playlistId === schedule.playlistId
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleEdit(schedule)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {schedule.eventName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {schedule.playlistName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                    </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </span>
                  </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            {schedule.enabled ? (
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            ) : (
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
                </div>
              </div>
              
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule View</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentWeek(prev => prev.clone().subtract(1, 'week'))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                  {getWeekRange()}
                </span>
                <button
                  onClick={() => setCurrentWeek(prev => prev.clone().add(1, 'week'))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-8 gap-1">
              {/* Time column */}
              <div className="space-y-1">
                <div className="h-8"></div> {/* Header spacer */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="h-12 text-xs text-gray-500 text-right pr-2 pt-1">
                    {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>

              {/* Day columns */}
              {getWeekDays().map((day, dayIndex) => {
                const dayNumber = dayIndex + 1;
                const defaultSchedule = getDefaultPlaylist(dayNumber);
                const specialEvents = getSpecialEvents(day);

                return (
                  <div key={dayIndex} className="space-y-1">
                    {/* Day header */}
                    <div className="h-8 flex flex-col items-center justify-center text-xs font-medium">
                      <div className="text-gray-900">{day.format('ddd')}</div>
                      <div className="text-gray-500">{day.format('D')}</div>
                    </div>

                    {/* Time slots */}
                    {Array.from({ length: 24 }, (_, hour) => {
                      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                      
                      // Check for special events first (they override defaults)
                      const relevantEvents = specialEvents.filter(schedule => {
                        const startHour = parseInt(schedule.startTime.split(':')[0]);
                        const endHour = parseInt(schedule.endTime.split(':')[0]);
                        return hour >= startHour && hour < endHour;
                      });

                      // Check for default schedule if no events
                      const relevantDefault = !relevantEvents.length && defaultSchedule ? {
                        startHour: parseInt(defaultSchedule.startTime.split(':')[0]),
                        endHour: parseInt(defaultSchedule.endTime.split(':')[0])
                      } : null;

                      const hasDefault = relevantDefault && hour >= relevantDefault.startHour && hour < relevantDefault.endHour;

                      return (
                        <div
                          key={hour}
                          className="h-12 border border-gray-100 relative"
                        >
                          {/* Default schedule (background) */}
                          {hasDefault && (
                            <div className="absolute inset-0 bg-blue-50 border border-blue-200 rounded-sm flex items-center justify-center">
                              <span className="text-xs text-blue-700 font-medium truncate px-1">
                                {defaultSchedule.playlistName}
                              </span>
                            </div>
                          )}
                          
                          {/* Special events (overlay) */}
                          {relevantEvents.map((schedule, index) => (
                            <div
                              key={schedule.playlistId}
                              className="absolute inset-0 bg-purple-100 border border-purple-300 rounded-sm flex items-center justify-center"
                              style={{ zIndex: index + 10 }}
                            >
                              <span className="text-xs text-purple-700 font-medium truncate px-1">
                                {schedule.eventName}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Default Schedule</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                <span>Special Event</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSchedule.type === 'default' ? 'Edit Default Schedule' : 'Edit Special Event'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Validation Messages */}
              {validation.errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-center text-red-700 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center text-yellow-700 text-sm">
                      <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {successMessage}
                  </div>
                </div>
              )}
              {/* Debug: Show successMessage state */}
              <div className="text-xs text-gray-500 mb-2">
                Debug - successMessage: "{successMessage}"
              </div>

              {/* Schedule Settings */}
            <div className="space-y-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Schedule</label>
                  <button
                    onClick={() => updateEditingSchedule('enabled', !editingSchedule.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editingSchedule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editingSchedule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Event Name (for special events) */}
                {editingSchedule.type === 'event' && (
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Name
                    </label>
                <input
                      type="text"
                      value={editingSchedule.eventName || ''}
                      onChange={(e) => updateEditingSchedule('eventName', e.target.value)}
                      placeholder="e.g., Client Meeting - ABC Corp"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                )}

                {/* Date Settings (for special events) */}
                {editingSchedule.type === 'event' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editingSchedule.startDate || ''}
                        onChange={(e) => updateEditingSchedule('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editingSchedule.endDate || ''}
                        onChange={(e) => updateEditingSchedule('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
              </div>
                )}
              
                {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                  <input
                    type="time"
                      value={formatTime(editingSchedule.startTime)}
                      onChange={(e) => updateEditingSchedule('startTime', e.target.value + ':00')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                  <input
                    type="time"
                      value={formatTime(editingSchedule.endTime)}
                      onChange={(e) => updateEditingSchedule('endTime', e.target.value + ':00')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
                {/* Days Selection (for default schedules) */}
                {editingSchedule.type === 'default' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days of Week
                    </label>
                  <div className="grid grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(dayNumber => (
                        <button
                          key={dayNumber}
                          onClick={() => toggleDay(dayNumber)}
                          className={`p-2 text-xs font-medium rounded-lg transition-colors ${getDayClass(dayNumber)}`}
                        >
                          {getDayLabel(dayNumber)}
                        </button>
                    ))}
                  </div>
                </div>
              )}
              
                {/* Schedule Type */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Type
                  </label>
                  <select
                    value={editingSchedule.type || 'default'}
                    onChange={(e) => updateEditingSchedule('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="default">Default Daily Schedule</option>
                    <option value="event">Special Event</option>
                  </select>
                </div>
            </div>
            
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
              <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                  Cancel
              </button>
              <button
                  onClick={handleSave}
                  disabled={validation.errors.length > 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Save Schedule
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;