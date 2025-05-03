
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthContext } from '@/App';

const Landing = () => {
  // Use the authentication context to check if user is logged in
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-1 container px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Perfect Tracing, <span className="text-traceMate">Every Time</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 px-4">
            Transform your creative process with our AI-powered tracing tool. 
            Overlay images onto your camera feed for precise, distortion-free tracing.
          </p>
          <div className="flex justify-center">
            <Link to={isAuthenticated ? "/app/dashboard" : "/auth"}>
              <Button size="lg" className="w-full sm:w-auto">
                {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Main App Preview Image */}
        <div className="mt-16 mb-8 max-w-5xl mx-auto">
          <img 
            src="https://i.postimg.cc/BnJDNYcK/Chat-GPT-Image-May-2-2025-12-51-32-PM.png" 
            alt="TraceMate App Preview" 
            className="w-full shadow-xl rounded-xl overflow-hidden border border-border"
          />
        </div>
      </section>
      
      {/* Feature Section */}
      <section className="bg-muted py-16">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for perfect tracing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Precision Overlay</h3>
              <p className="text-muted-foreground">
                Adjust opacity, scale, and position for precise tracing of reference images.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-medium mb-2">LiveSync</h3>
              <p className="text-muted-foreground">
                Broadcast your reference image to multiple devices simultaneously.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Image Library</h3>
              <p className="text-muted-foreground">
                Store and organize your reference images for quick access anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="container px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to transform your tracing workflow?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of artists who are already using TraceMate to perfect their work.
        </p>
        <Link to={isAuthenticated ? "/app/dashboard" : "/auth"}>
          <Button size="lg">
            {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2" size={16} />
          </Button>
        </Link>
      </section>
      
      <Footer />
    </div>
  );
};

export default Landing;
