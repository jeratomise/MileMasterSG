
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SystemConfig } from '../types';

interface AuthContextType {
  user: User | null;
  systemConfig: SystemConfig;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  // Admin Functions
  getAllUsers: () => User[];
  toggleUserStatus: (userId: string) => void;
  updateSystemConfig: (config: SystemConfig) => void;
  changePassword: (password: string) => Promise<void>;
}

const DEFAULT_CONFIG: SystemConfig = {
  allowSignups: true,
  landingPage: {
    heroTitle: "Maximize your miles.\nMinimize the hassle.",
    heroSubtitle: "The AI-powered bill tracker designed for Singaporean credit card strategists. Upload statements, get optimization insights, and never miss a payment.",
    bullets: [
        "Auto-extract data from PDF statements",
        "Spend trend analysis by bank",
        "Singapore-Crowd Source Mile Strategies",
        "Elite Corp Pilot Project (JNS)"
    ]
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    // 1. Load System Config
    const savedConfig = localStorage.getItem('milemaster_config');
    if (savedConfig) {
        setSystemConfig(JSON.parse(savedConfig));
    } else {
        localStorage.setItem('milemaster_config', JSON.stringify(DEFAULT_CONFIG));
    }

    // 2. Seed Admin User & Migrate existing users to have roles
    const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
    let usersUpdated = false;
    const testEmail = 'admin@milemaster.com';
    
    // Create admin if not exists
    if (!users.find((u: any) => u.email === testEmail)) {
        const testUser = {
            id: 'admin-test-id',
            name: 'Admin Tester',
            email: testEmail,
            password: 'password123',
            joinedAt: new Date().toISOString(),
            role: 'admin' as const,
            status: 'active' as const
        };
        users.push(testUser);
        usersUpdated = true;
    }

    // Migrate: Ensure all users have role and status
    users.forEach((u: any) => {
        if (!u.role) {
            u.role = (u.email === testEmail ? 'admin' : 'user') as 'admin' | 'user';
            u.status = 'active' as const;
            usersUpdated = true;
        }
    });

    if (usersUpdated) {
        localStorage.setItem('milemaster_users', JSON.stringify(users));
    }

    // 3. Check for active session
    const sessionUser = localStorage.getItem('milemaster_session');
    if (sessionUser) {
      // Re-verify against the database to ensure we have the latest role/status
      const parsedSession = JSON.parse(sessionUser);
      const dbUser = users.find((u: any) => u.email === parsedSession.email);
      
      if (dbUser && dbUser.status === 'active') {
          const { password, ...userWithoutPass } = dbUser;
          // Ensure role/status are treated as valid User properties
          setUser(userWithoutPass as User);
      } else {
          // If user was deleted or suspended while logged in
          localStorage.removeItem('milemaster_session');
          setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const updateSystemConfig = (config: SystemConfig) => {
    setSystemConfig(config);
    localStorage.setItem('milemaster_config', JSON.stringify(config));
  };

  const getAllUsers = (): User[] => {
    const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
    // Return users without passwords
    return users.map(({ password, ...u }: any) => u as User);
  };

  const toggleUserStatus = (userId: string) => {
      const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
      const updatedUsers = users.map((u: any) => {
          if (u.id === userId) {
              // Prevent disabling the main admin
              if (u.email === 'admin@milemaster.com') return u;
              
              const newStatus = u.status === 'active' ? 'suspended' : 'active';
              return { ...u, status: newStatus as 'active' | 'suspended' };
          }
          return u;
      });
      localStorage.setItem('milemaster_users', JSON.stringify(updatedUsers));
      
      // Force update if we modified the current user (though unlikely for admin to ban self)
      if (user && user.id === userId) {
         logout();
      }
  };

  const changePassword = async (newPassword: string) => {
      return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
              if (!user) {
                  reject(new Error("No user logged in"));
                  return;
              }
              const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
              const updatedUsers = users.map((u: any) => {
                  if (u.id === user.id) {
                      return { ...u, password: newPassword };
                  }
                  return u;
              });
              localStorage.setItem('milemaster_users', JSON.stringify(updatedUsers));
              resolve();
          }, 500);
      });
  };

  const login = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
        const foundUser = users.find((u: any) => u.email === email && u.password === password);
        
        if (foundUser) {
          if (foundUser.status === 'suspended') {
              reject(new Error("Account suspended. Contact administrator."));
              return;
          }
          const { password, ...userWithoutPass } = foundUser;
          setUser(userWithoutPass as User);
          localStorage.setItem('milemaster_session', JSON.stringify(userWithoutPass));
          resolve();
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 800);
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (!systemConfig.allowSignups) {
            reject(new Error("New registrations are currently disabled by the administrator."));
            return;
        }

        const users = JSON.parse(localStorage.getItem('milemaster_users') || '[]');
        
        if (users.find((u: any) => u.email === email)) {
          reject(new Error("User already exists"));
          return;
        }

        const newUser = {
          id: crypto.randomUUID(),
          name,
          email,
          password, 
          joinedAt: new Date().toISOString(),
          role: 'user' as const,
          status: 'active' as const
        };

        users.push(newUser);
        localStorage.setItem('milemaster_users', JSON.stringify(users));
        
        const { password: _, ...userWithoutPass } = newUser;
        setUser(userWithoutPass as User);
        localStorage.setItem('milemaster_session', JSON.stringify(userWithoutPass));
        resolve();
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('milemaster_session');
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        systemConfig,
        login, 
        signup, 
        logout, 
        loading,
        getAllUsers,
        toggleUserStatus,
        updateSystemConfig,
        changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
