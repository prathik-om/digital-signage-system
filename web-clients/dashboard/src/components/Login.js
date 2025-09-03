import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import config, { getApiUrl } from '../config.js';

const API_BASE_URL = config.API_BASE_URL;

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          data: {
            action: isLogin ? 'login' : 'register',
            ...formData
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.user || { email: formData.email });
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Digital Signage Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input id="name" name="name" type="text" required={!isLogin} className="input-field rounded-t-lg" placeholder="Full Name" value={formData.name} onChange={handleChange} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={`input-field ${!isLogin ? '' : 'rounded-t-lg'} ${isLogin ? 'rounded-t-lg' : ''}`} placeholder="Email address" value={formData.email} onChange={handleChange} />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="input-field rounded-b-lg pr-10" placeholder="Password" value={formData.password} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 hover:text-blue-500">
                {isLogin ? 'Need an account? Register' : 'Have an account? Sign In'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 