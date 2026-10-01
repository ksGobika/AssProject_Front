import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, notifications, unreadCount, refreshNotifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header>
      <div>
        <h1>CSRM PORTAL - Campus Smart Resource Management</h1>
        <p>
          Logged in as: <strong>{user?.fullName}</strong> ({user?.role}) | Department: {user?.department || 'General'}
        </p>

        <nav>
          {user?.role === 'ADMIN' ? (
            <>
              <button
                type="button"
                disabled={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Dashboard Overview
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              >
                User Approvals
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'resources'}
                onClick={() => setActiveTab('resources')}
              >
                Resources Management
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'bookings'}
                onClick={() => setActiveTab('bookings')}
              >
                All Bookings
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'reports'}
                onClick={() => setActiveTab('reports')}
              >
                Utilization Reports
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
              >
                Audit Logs
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={activeTab === 'catalog'}
                onClick={() => setActiveTab('catalog')}
              >
                Browse Resources Catalog
              </button>
              {' '}
              <button
                type="button"
                disabled={activeTab === 'my-bookings'}
                onClick={() => setActiveTab('my-bookings')}
              >
                My Reservations
              </button>
            </>
          )}
          {' | '}
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              refreshNotifications();
            }}
          >
            Notifications {unreadCount > 0 ? `(${unreadCount} Unread)` : `(${notifications.length})`}
          </button>
          {' '}
          <button type="button" onClick={logout}>
            Sign Out
          </button>
        </nav>

        {showNotifications && (
          <div>
            <br />
            <fieldset>
              <legend>Notifications</legend>
              {unreadCount > 0 && (
                <p>
                  <button type="button" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                </p>
              )}
              {notifications.length === 0 ? (
                <p>No notifications.</p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <strong>[{n.type}] {n.title}</strong> - {n.message}
                      {!n.isRead && (
                        <>
                          {' '}
                          <button type="button" onClick={(e) => handleMarkAsRead(n.id, e)}>
                            Mark as read
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
          </div>
        )}

        <hr />
      </div>
    </header>
  );
};
