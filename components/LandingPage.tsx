
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Check, Loader2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, signup, systemConfig } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Split title manually for styling if needed, or use simple break
  const titleParts = systemConfig.landingPage.heroTitle.split('\n');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left: Hero Content */}
      <div className="lg:w-1/2 bg-indigo-900 text-white flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             {/* Abstract Pattern */}
             <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-purple-500 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-2xl tracking-tight">MileMaster SG</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 whitespace-pre-line">
            {systemConfig.landingPage.heroTitle}
          </h1>
          
          <p className="text-indigo-200 text-lg mb-8 max-w-md">
            {systemConfig.landingPage.heroSubtitle}
          </p>

          <div className="space-y-4">
            {systemConfig.landingPage.bullets.map((bullet, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div className="bg-indigo-800 p-2 rounded-full"><Check className="w-4 h-4 text-indigo-400" /></div>
                    <span className="text-indigo-100">{bullet}</span>
                </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12 text-sm text-indigo-400">
          © 2025 MileMaster SG. Secure Client-side Processing.
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start tracking your miles journey today.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-indigo-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
