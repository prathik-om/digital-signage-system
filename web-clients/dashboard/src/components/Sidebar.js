import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Image, 
  List, 
  AlertTriangle, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/content', icon: Image, label: 'Content' },
    { path: '/playlists', icon: List, label: 'Playlists' },
    { path: '/emergency', icon: AlertTriangle, label: 'Emergency' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Digital Signage</h1>
        <p className="text-sm text-gray-600 mt-1">Event Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 