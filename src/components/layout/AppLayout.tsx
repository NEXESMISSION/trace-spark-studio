
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Navbar from './Navbar';
import { AuthContext } from '@/App';

const AppLayout = () => {
  // Use the authentication context instead of managing state locally
  const { user, isAuthenticated } = useContext(AuthContext);

  // The authentication check is now handled by the ProtectedRoute in App.tsx
  // So we can just render the layout
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
