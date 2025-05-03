import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Define types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load the Google Identity Services script
    const loadGoogleScript = () => {
      // Check if script is already loaded
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        initializeGoogleSignIn();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    };
    
    loadGoogleScript();
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  const initializeGoogleSignIn = () => {
    if (window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: '678008224294-aun88020g4lmoppf04uvulecrp6ajvf7.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'redirect',  // Use redirect instead of popup
        login_uri: window.location.origin + '/auth/google/callback', // We'll need to handle this route
      });
      
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonRef.current.clientWidth,
      });
    }
  };
  
  const handleCredentialResponse = async (response: any) => {
    try {
      // Get the ID token from the response
      const idToken = response.credential;
      
      // Here you would typically validate this token with your backend
      // For this implementation, we'll manually decode the JWT to get user info
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      // Create a session in your app
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) {
        // If Supabase integration fails, we can still use the token directly
        console.log('Supabase auth error:', error);
        
        // Store token in localStorage for persistence
        localStorage.setItem('google_auth_token', idToken);
        localStorage.setItem('user', JSON.stringify({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          avatar_url: payload.picture,
        }));
        
        toast({
          title: "Login successful",
          description: `Welcome, ${payload.name}!`,
        });
        
        // Navigate to app
        navigate('/app');
      } else {
        // Supabase auth succeeded
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/app');
        }
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      toast({
        title: "Authentication failed",
        description: "Could not authenticate with Google.",
        variant: "destructive",
      });
    }
  };
  
  // Alternative manual button for environments where Google button doesn't work
  const handleManualGoogleSignIn = () => {
    // Create a direct link to Google OAuth
    const clientId = '678008224294-aun88020g4lmoppf04uvulecrp6ajvf7.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:8080/auth/google/callback');
    const scope = encodeURIComponent('profile email');
    const responseType = 'token';
    const accessType = 'offline';
    const prompt = 'consent';
    
    // Use the exact URL format that matches your Google Cloud Console configuration
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&access_type=${accessType}&prompt=${prompt}`;
    
    console.log('Redirecting to:', authUrl);
    
    // Redirect to Google auth
    window.location.href = authUrl;
  };
  
  return (
    <div className="w-full">
      {/* Google's rendered button */}
      <div ref={buttonRef} className="w-full mb-2"></div>
      
      {/* Fallback button in case Google's button doesn't work */}
      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={handleManualGoogleSignIn}
      >
        <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google (Alternative)
      </Button>
    </div>
  );
};

export default GoogleSignIn;
