import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('Processing Google auth callback');
        console.log('URL:', window.location.href);
        console.log('Hash:', location.hash);
        console.log('Search:', location.search);
        
        // Check for access token in the URL hash (from our manual flow)
        const params = new URLSearchParams(location.hash.substring(1));
        const accessToken = params.get('access_token');
        
        // Check for error in the URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const error = urlParams.get('error');
        
        if (error) {
          console.error('Google auth error:', error);
          toast({
            title: "Authentication failed",
            description: `Google returned an error: ${error}`,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        if (accessToken) {
          console.log('Access token found in URL');
          
          // Use the access token to get user info from Google
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          
          if (!response.ok) {
            console.error('Failed to fetch user info:', await response.text());
            throw new Error('Failed to fetch user info from Google');
          }
          
          const userData = await response.json();
          console.log('User data:', userData);
          
          // Create a user object
          const googleUser = {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            avatar_url: userData.picture,
            provider: 'google',
          };
          
          // Store in localStorage
          localStorage.setItem('google_auth_token', accessToken);
          localStorage.setItem('user', JSON.stringify(googleUser));
          
          // Update auth context
          setUser(googleUser);
          setIsAuthenticated(true);
          
          toast({
            title: "Login successful",
            description: `Welcome, ${googleUser.name}!`,
          });
          
          // Redirect to app
          navigate('/app');
        } else {
          // Check for code in the URL (authorization code flow)
          const code = urlParams.get('code');
          
          if (code) {
            console.log('Authorization code found in URL');
            // In a real implementation, you would exchange this code for tokens
            // on your backend server. For this example, we'll just show a message.
            toast({
              title: "Authorization code received",
              description: "In a production app, this code would be exchanged for tokens on your backend.",
            });
            navigate('/auth');
            return;
          }
          
          // If we're here without a token or code, something went wrong
          console.error('No token or code found in URL');
          toast({
            title: "Authentication failed",
            description: "No authentication data received from Google.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error processing Google auth callback:', error);
        toast({
          title: "Authentication failed",
          description: "Could not complete Google authentication.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };
    
    processAuth();
  }, [location, navigate, setUser, setIsAuthenticated, toast]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing authentication...</h2>
        <p className="text-muted-foreground">Please wait while we complete your Google sign-in.</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
