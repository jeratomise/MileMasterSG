
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Loader2, Zap, PieChart, Globe, Mail, ChevronLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

export const LandingPage: React.FC = () => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else if (mode === 'signup') {
        await signup(formData.name, formData.email, formData.password);
      } else if (mode === 'forgot') {
        await resetPassword(formData.email);
        setSuccess('A recovery link has been sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Vision & Brand */}
      <div className="lg:w-7/12 relative overflow-hidden flex flex-col p-8 lg:p-16">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between mb-12 lg:mb-24">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">CreditTrack</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400/80 bg-indigo-500/5 px-4 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-md">
                EliteX.CC Group • 2026
            </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-2xl">
            <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tight">
                Master Your <br/>
                <span className="text-indigo-500">Wealth.</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light max-w-lg">
                The definitive platform for Singapore's high-net-worth individuals to consolidate, analyze, and optimize credit utilization across all major banking institutions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group bg-white/[0.03] border border-white/5 p-6 rounded-2xl backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                    <Zap className="w-6 h-6 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-2">Neural Extraction</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Advanced Gemini 2.5 models instantly parse complex multi-bank statements with 99.9% accuracy.</p>
                </div>
                <div className="group bg-white/[0.03] border border-white/5 p-6 rounded-2xl backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                    <Globe className="w-6 h-6 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-2">Elite Milelion Strategy</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Personalized algorithms ensure every dollar spent maximizes your 4mpd or 6mpd bonus rewards.</p>
                </div>
            </div>
        </div>

        <div className="relative z-10 mt-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[11px] font-medium text-slate-500 uppercase tracking-widest">
            <p>© 2026 CreditTrack. An EliteX.CC Group Strategic Asset.</p>
            <div className="flex gap-8">
                <span className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-indigo-400 cursor-pointer transition-colors">Compliance</span>
            </div>
        </div>
      </div>

      {/* Right Column: Interaction Card */}
      <div className="lg:w-5/12 bg-[#0a0d14] flex items-center justify-center p-6 lg:p-12 relative">
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
         
         <div className="w-full max-w-sm relative z-10">
            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-3">
                    {mode === 'login' && 'Secure Access'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Reset Security'}
                </h2>
                <p className="text-slate-500 text-sm">
                    {mode === 'login' && 'Enter your credentials to manage your portfolio.'}
                    {mode === 'signup' && 'Join the EliteX network for premier tracking.'}
                    {mode === 'forgot' && 'Enter your email to receive a recovery link.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3 animate-shake">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identity Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                            placeholder="Full legal name"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Email</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                        placeholder="name@elitex.cc"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                {mode !== 'forgot' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Encryption Password</label>
                            {mode === 'login' && (
                                <button 
                                    type="button"
                                    onClick={() => setMode('forgot')}
                                    className="text-[10px] text-indigo-400 hover:text-white font-bold transition-colors uppercase tracking-widest"
                                >
                                    Forgot Key?
                                </button>
                            )}
                        </div>
                        <input 
                            type="password" 
                            required 
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                            placeholder="••••••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl font-bold hover:bg-indigo-500 active:transform active:scale-[0.98] transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {mode === 'login' && 'Authorize Session'}
                            {mode === 'signup' && 'Establish Profile'}
                            {mode === 'forgot' && 'Send Recovery'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                {mode === 'forgot' ? (
                    <button 
                        onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                        className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Login
                    </button>
                ) : (
                    <p className="text-xs text-slate-500 font-medium">
                        {mode === 'login' ? "Require an invitation? " : "Authorized member? "}
                        <button 
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                            className="text-indigo-400 font-black hover:text-indigo-300 transition-colors uppercase tracking-[0.1em] ml-1"
                        >
                            {mode === 'login' ? 'Join Network' : 'Identify Now'}
                        </button>
                    </p>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
