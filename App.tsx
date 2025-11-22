
import React, { useState, useEffect } from 'react';
import { BillUploader } from './components/BillUploader';
import { Dashboard } from './components/Dashboard';
import { InsightPanel } from './components/InsightPanel';
import { ReminderModal } from './components/ReminderModal';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { Bill } from './types';
import { LayoutDashboard, PieChart, Bell, Settings as SettingsIcon, Menu, Shield, LogOut, LockKeyhole } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [view, setView] = useState<'dashboard' | 'upload' | 'settings' | 'admin'>('dashboard');
  const [showReminder, setShowReminder] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Derived key for storing user-specific data
  const STORAGE_KEY = user ? `milemaster_bills_${user.id}` : null;

  // Load from local storage when user changes
  useEffect(() => {
    if (STORAGE_KEY) {
      const savedBills = localStorage.getItem(STORAGE_KEY);
      if (savedBills) {
        setBills(JSON.parse(savedBills));
      } else {
        setBills([]); // Reset if new user has no data
      }
    }
  }, [STORAGE_KEY]);

  // Save to local storage on bill change
  useEffect(() => {
    if (STORAGE_KEY && bills) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    }
  }, [bills, STORAGE_KEY]);

  const handleBillsProcessed = (newBills: Bill[]) => {
    setBills(prev => [...prev, ...newBills]);
    setView('dashboard');
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  };

  const handleAddBill = (newBill: Bill) => {
    setBills(prev => [...prev, newBill]);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse text-indigo-600">Loading MileMaster...</div></div>;
  }

  // If not logged in, show the new Landing/Auth Page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
         <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
             <Shield className="w-6 h-6" />
             MileMaster
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <Menu className="w-6 h-6 text-gray-600" />
         </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
            fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform transform lg:transform-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="p-6 flex flex-col border-b border-gray-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl mb-1">
                    <Shield className="w-8 h-8" />
                    MileMaster
                </div>
                <span className="text-xs text-gray-400 ml-10">v1.3.0</span>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role === 'admin' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded">ADMIN</span>}
                  </div>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-2">
                <button 
                    onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </button>
                <button 
                    onClick={() => { setView('upload'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'upload' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <PieChart className="w-5 h-5" />
                    Upload & Analyze
                </button>
                
                {user.role === 'admin' && (
                    <button 
                        onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LockKeyhole className="w-5 h-5" />
                        Admin Portal
                    </button>
                )}

                <div className="pt-8 mt-8 border-t border-gray-100">
                    <button 
                        onClick={() => { setShowReminder(true); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <Bell className="w-5 h-5" />
                        Generate Reminder
                    </button>
                    <button 
                        onClick={() => { setView('settings'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <SettingsIcon className="w-5 h-5" />
                        Settings
                    </button>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 mt-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {view === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                            <p className="text-gray-500">Welcome back, {user.name}. Here is your summary.</p>
                        </div>
                        <button 
                            onClick={() => setView('upload')}
                            className="hidden md:block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
                        >
                            + Upload Bill
                        </button>
                    </header>

                    <InsightPanel bills={bills} />
                    
                    <Dashboard 
                        bills={bills} 
                        onUpdateBill={handleUpdateBill}
                        onAddBill={handleAddBill}
                    />
                </div>
            )}

            {view === 'upload' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                     <header>
                        <button 
                            onClick={() => setView('dashboard')}
                            className="text-sm text-gray-500 hover:text-gray-900 mb-2 block"
                        >
                            &larr; Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Upload Statement</h1>
                        <p className="text-gray-500">Upload a screenshot or PDF of your bill. AI will extract the details.</p>
                    </header>
                    <BillUploader onBillProcessed={handleBillsProcessed} />
                </div>
            )}

            {view === 'settings' && (
                <Settings />
            )}

            {view === 'admin' && user.role === 'admin' && (
                <AdminPanel />
            )}
        </main>
      </div>

      <ReminderModal 
        bills={bills} 
        isOpen={showReminder} 
        onClose={() => setShowReminder(false)} 
      />
    </div>
  );
};

export default App;
