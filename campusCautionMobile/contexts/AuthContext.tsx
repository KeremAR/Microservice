import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useCustomAuth from '../hooks/useCustomAuth';

type AuthContextType = ReturnType<typeof useCustomAuth> & {
  initialized: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useCustomAuth();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const initAuth = async () => {
      await auth.loadSession();
      setInitialized(true);
    };
    
    initAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ ...auth, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth hook must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 