
import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <Link to="/" className="font-bold text-xl text-traceMate">
          Trace<span className="text-foreground">Mate</span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
      
      <div className="p-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} TraceMate. All rights reserved.
      </div>
    </div>
  );
};

export default AuthLayout;
