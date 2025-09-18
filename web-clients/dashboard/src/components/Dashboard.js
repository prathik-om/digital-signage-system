import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Play, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const Dashboard = ({ user }) => {
  const { currentUserId } = useAuth();
  const [stats, setStats] = useState({
    totalContent: 0,
    activePlaylists: 0,
    emergencyMessages: 0,
    totalViews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUserId]); // Re-fetch when user changes

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from real APIs with user context
      const [contentResponse, playlistResponse, emergencyResponse] = await Promise.all([
        apiService.getContent(currentUserId),
        apiService.getPlaylists(currentUserId),
        apiService.getEmergencyMessages(currentUserId)
      ]);

      // Update stats with real data
      setStats({
        totalContent: contentResponse.success ? contentResponse.content.length : 0,
        activePlaylists: playlistResponse.success ? playlistResponse.playlists.length : 0,
        emergencyMessages: emergencyResponse.success ? emergencyResponse.emergency_messages.length : 0,
        totalViews: 1250 // This would come from analytics API
      });

      // Generate recent activity from the fetched data
      const activities = [];
      
      if (contentResponse.success && contentResponse.content.length > 0) {
        const latestContent = contentResponse.content[0];
        activities.push({
          id: 1,
          type: 'content',
          action: 'Content available',
          item: latestContent.title,
          time: new Date(latestContent.created_at).toLocaleString()
        });
      }

      if (playlistResponse.success && playlistResponse.playlists.length > 0) {
        const latestPlaylist = playlistResponse.playlists[0];
        activities.push({
          id: 2,
          type: 'playlist',
          action: 'Playlist available',
          item: latestPlaylist.name,
          time: new Date(latestPlaylist.created_at).toLocaleString()
        });
      }

      if (emergencyResponse.success && emergencyResponse.emergency_messages.length > 0) {
        const latestEmergency = emergencyResponse.emergency_messages[0];
        activities.push({
          id: 3,
          type: 'emergency',
          action: 'Emergency message',
          item: latestEmergency.title,
          time: new Date(latestEmergency.CREATEDTIME).toLocaleString()
        });
      }

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API fails
      setStats({
        totalContent: 0,
        activePlaylists: 0,
        emergencyMessages: 0,
        totalViews: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Content',
      value: stats.totalContent,
      icon: Image,
      color: 'blue',
      description: 'Images and videos'
    },
    {
      title: 'Active Playlists',
      value: stats.activePlaylists,
      icon: Play,
      color: 'green',
      description: 'Currently playing'
    },
    {
      title: 'Emergency Messages',
      value: stats.emergencyMessages,
      icon: AlertTriangle,
      color: 'red',
      description: 'Active alerts'
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'purple',
      description: 'Display interactions'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'User'}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600'
          };
          
          return (
            <div key={index} className="dashboard-card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
              <div>
                <p className="font-medium text-blue-900">Upload Content</p>
                <p className="text-sm text-blue-700">Add new images or videos</p>
              </div>
              <Image className="h-5 w-5 text-blue-600" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
              <div>
                <p className="font-medium text-green-900">Create Playlist</p>
                <p className="text-sm text-green-700">Set up content rotation</p>
              </div>
              <Play className="h-5 w-5 text-green-600" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200">
              <div>
                <p className="font-medium text-red-900">Emergency Alert</p>
                <p className="text-sm text-red-700">Send urgent message</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.item}</p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-green-900">Content Server</p>
              <p className="text-sm text-green-700">Online</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-green-900">Display Players</p>
              <p className="text-sm text-green-700">3 Active</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-blue-900">Zoho Integration</p>
              <p className="text-sm text-blue-700">Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 