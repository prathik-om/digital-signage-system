import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';

const UserProfile = () => {
    const { currentUserId, logout } = useAuth();

    const handleLogout = () => {
        logout();
        // Redirect to login page or home
        window.location.href = '/';
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md border">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current User</h3>
                    <p className="text-sm text-gray-600">{currentUserId}</p>
                </div>
            </div>
            
            <div className="space-y-2">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
                
                <button
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
