import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';

const MainApp = () => {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div>
        <p>Loading CSRM System...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Auth />;
  }

  return (
    <div>
      <Navbar
        activeTab={user.role === 'ADMIN' ? (activeTab === 'catalog' ? 'overview' : activeTab) : (activeTab === 'overview' ? 'catalog' : activeTab)}
        setActiveTab={setActiveTab}
      />
      <main>
        {user.role === 'ADMIN' ? (
          <AdminDashboard
            activeTab={activeTab === 'catalog' ? 'overview' : activeTab}
            setActiveTab={setActiveTab}
          />
        ) : (
          <UserDashboard
            activeTab={activeTab === 'overview' ? 'catalog' : activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </main>
      <footer>
        <hr />
        <p>Campus Smart Resource Management System (CSRM) • Fullstack Assessment</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
