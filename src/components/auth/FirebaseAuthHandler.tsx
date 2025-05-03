import { useEffect, useContext } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const FirebaseAuthHandler = () => {
  const { setUser, setIsAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        // Check if we have a redirect result
        const result = await getRedirectResult(auth);
        
        if (result) {
          // User successfully signed in with redirect
          const firebaseUser = result.user;
          
          // Create a user object for our app
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar_url: firebaseUser.photoURL,
            provider: 'google',
          };
          
          // Store in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          setUser(user);
          setIsAuthenticated(true);
          
          toast({
            title: "Login successful",
            description: `Welcome, ${user.name}!`,
          });
          
          // Navigate to app
          navigate('/app');
        }
      } catch (error: any) {
        console.error('Firebase redirect result error:', error);
        if (error.code !== 'auth/null-result') {
          toast({
            title: "Authentication failed",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    };
    
    checkRedirectResult();
  }, [setUser, setIsAuthenticated, toast, navigate]);
  
  // This component doesn't render anything
  return null;
};

export default FirebaseAuthHandler;
