
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="font-bold text-lg text-traceMate mb-2">
            Trace<span className="text-foreground">Mate</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Improve your drawing skills through digital tracing.
          </p>
          
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">Company</Link>
            <Link to="/about" className="hover:text-foreground">About Us</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
          
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TraceMate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
