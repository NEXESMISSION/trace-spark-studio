
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/update-password',
      });
      
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Password reset initiated",
          description: "Check your email for the password reset link.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Link to="/auth" className="inline-flex items-center text-sm text-traceMate hover:underline">
                <ArrowLeft size={16} className="mr-1" />
                Back to login
              </Link>
              
              <h2 className="text-2xl font-semibold">Reset Password</h2>
              <p className="text-muted-foreground">
                Enter your email address, and we'll send you instructions to reset your password.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <span className="font-medium">{email}</span>.
              Please check your email and follow the instructions to reset your password.
            </p>
            <p className="text-muted-foreground text-sm">
              Didn't receive an email? Check your spam folder or{" "}
              <button 
                onClick={() => setIsSubmitted(false)} 
                className="text-traceMate hover:underline"
              >
                try again
              </button>
            </p>
            
            <Link to="/auth">
              <Button variant="outline" className="w-full mt-4">
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PasswordReset;
