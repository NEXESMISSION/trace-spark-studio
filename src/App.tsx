
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

// Layouts
import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";

// Pages
import Landing from "./pages/Landing";
import Auth from "./pages/auth/Auth";
import PasswordReset from "./pages/auth/PasswordReset";
import GoogleCallback from "./pages/auth/GoogleCallback";
import Home from "./pages/app/Home";
import TraceView from "./pages/app/TraceView";
import LiveSync from "./pages/app/LiveView";
import Profile from "./pages/app/Profile";
import NotFound from "./pages/NotFound";

// Components
import FirebaseAuthHandler from "./components/auth/FirebaseAuthHandler";

// Create auth context
export const AuthContext = createContext<{
  user: any;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}>({
  user: null,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  login: async () => ({ error: null }),
  logout: async () => {},
});

// Create a query client with retry disabled for faster development experience
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 10000, // Reduce refetch by setting stale time
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
    },
  },
});

// Protected route component that checks authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auth provider component to manage authentication state
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check for Supabase session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setUser(data.session.user);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // If no Supabase session, check for user in localStorage
        const localUser = localStorage.getItem('user');
        
        if (localUser) {
          setUser(JSON.parse(localUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener for Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        // Only clear Supabase auth - don't clear local user here
        const localUser = localStorage.getItem('user');
        if (!localUser) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    });
    
    // Set up auth state listener for Firebase
    const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          provider: 'google',
        };
        
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(user));
      }
    });
    
    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (data.session) {
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
      
      return { error };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    }
  };
  
  // Logout function
  const logout = async () => {
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear Google auth data
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('user');
    
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // If still loading, show nothing
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setUser, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner duration={2000} closeButton richColors />
      <BrowserRouter>
        <AuthProvider>
          <FirebaseAuthHandler />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<Auth />} />
              <Route path="reset" element={<PasswordReset />} />
              <Route path="google/callback" element={<GoogleCallback />} />
            </Route>
            
            {/* App Routes - Protected */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* Home is the default page */}
              <Route index element={<Home />} />
              <Route path="home" element={<Home />} />
              <Route path="dashboard" element={<Navigate to="/app" replace />} />
              <Route path="trace" element={<TraceView />} />
              <Route path="livesync" element={<LiveSync />} />
              <Route path="profile" element={<Profile />} />
              {/* Redirect any other app paths to home */}
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
