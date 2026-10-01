import React, { useState, useEffect } from 'react';
import { adminAPI, resourceAPI, bookingAPI, auditAPI } from '../services/api';

export const AdminDashboard = ({ activeTab, setActiveTab }) => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'CLASSROOM',
    location: '',
    capacity: 30,
    availability: true,
    description: '',
    hourlyRate: 0.0,
  });

  const [allBookings, setAllBookings] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [anRes, uRes, pRes, rRes, bRes, utRes, aRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getUsers(),
        adminAPI.getPendingUsers(),
        resourceAPI.getAll(),
        bookingAPI.getBookings(),
        adminAPI.getUtilizationReport(),
        auditAPI.getLogs(),
      ]);

      if (anRes.success) setAnalytics(anRes.data);
      if (uRes.success) setUsers(uRes.data);
      if (pRes.success) setPendingUsers(pRes.data);
      if (rRes.success) setResources(rRes.data);
      if (bRes.success) setAllBookings(bRes.data);
      if (utRes.success) setUtilizationData(utRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id) => {
    try {
      const res = await adminAPI.approveUser(id);
      setMsg({ success: res.message || 'User approved successfully!', error: '' });
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const handleRejectUser = async (id) => {
    try {
      const res = await adminAPI.rejectUser(id);
      setMsg({ success: res.message || 'User rejected', error: '' });
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      setMsg({ success: 'Role updated successfully', error: '' });
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const openCreateResource = () => {
    setEditingResource(null);
    setResourceForm({
      name: '',
      type: 'CLASSROOM',
      location: '',
      capacity: 30,
      availability: true,
      description: '',
      hourlyRate: 0.0,
    });
    setResourceModalOpen(true);
  };

  const openEditResource = (r) => {
    setEditingResource(r);
    setResourceForm({
      name: r.name,
      type: r.type,
      location: r.location,
      capacity: r.capacity,
      availability: r.availability,
      description: r.description || '',
      hourlyRate: r.hourlyRate || 0.0,
    });
    setResourceModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await resourceAPI.update(editingResource.id, resourceForm);
        setMsg({ success: 'Resource updated successfully', error: '' });
      } else {
        await resourceAPI.create(resourceForm);
        setMsg({ success: 'Resource created successfully', error: '' });
      }
      setResourceModalOpen(false);
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourceAPI.delete(id);
      setMsg({ success: 'Resource deleted', error: '' });
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const handleBookingAction = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, status);
      setMsg({ success: `Booking status changed to ${status}`, error: '' });
      loadAllData();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.resourceType?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.username?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <section>
      {msg.success && (
        <div>
          <p><strong>Success:</strong> {msg.success} <button type="button" onClick={() => setMsg({ ...msg, success: '' })}>x</button></p>
        </div>
      )}
      {msg.error && (
        <div>
          <p><strong>Error:</strong> {msg.error} <button type="button" onClick={() => setMsg({ ...msg, error: '' })}>x</button></p>
        </div>
      )}

      {loading && <p>Loading data, please wait...</p>}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          <h2>System Overview & Metrics</h2>
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count / Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Resources</td>
                <td>{analytics?.totalResources || resources.length}</td>
              </tr>
              <tr>
                <td>Active Bookings</td>
                <td>{analytics?.activeBookings || 0}</td>
              </tr>
              <tr>
                <td>Pending User Approvals</td>
                <td>{pendingUsers.length}</td>
              </tr>
              <tr>
                <td>Registered Accounts</td>
                <td>{users.length}</td>
              </tr>
            </tbody>
          </table>

          <br />

          <h3>Pending Approvals Quick View</h3>
          {pendingUsers.length === 0 ? (
            <p>No pending approvals at this time.</p>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.department}</td>
                    <td>
                      <button type="button" onClick={() => handleApproveUser(u.id)}>Approve</button>
                      {' '}
                      <button type="button" onClick={() => handleRejectUser(u.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* USERS & APPROVALS TAB */}
      {activeTab === 'users' && (
        <div>
          <h2>User Management & Approvals</h2>

          <h3>Pending User Registrations ({pendingUsers.length})</h3>
          {pendingUsers.length === 0 ? (
            <p>No users waiting for approval.</p>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Requested Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.fullName}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.department}</td>
                    <td>{u.role}</td>
                    <td>
                      <button type="button" onClick={() => handleApproveUser(u.id)}>Approve</button>
                      {' '}
                      <button type="button" onClick={() => handleRejectUser(u.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <br />

          <h3>All Active Users ({users.length})</h3>
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.department}</td>
                  <td>{u.role}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="FACULTY">FACULTY</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div>
          <h2>Campus Resources Management</h2>
          <p>
            <button type="button" onClick={openCreateResource}>+ Add New Resource</button>
          </p>

          {resourceModalOpen && (
            <form onSubmit={handleSaveResource}>
              <fieldset>
                <legend>{editingResource ? 'Edit Resource' : 'Create New Resource'}</legend>
                <p>
                  <label>
                    Resource Name:
                    <br />
                    <input
                      type="text"
                      required
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                    />
                  </label>
                </p>

                <p>
                  <label>
                    Category Type:
                    <br />
                    <select
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                    >
                      <option value="CLASSROOM">Classroom</option>
                      <option value="LAB">Laboratory</option>
                      <option value="EQUIPMENT">Equipment / Projector</option>
                      <option value="LOCKER">Locker</option>
                    </select>
                  </label>
                </p>

                <p>
                  <label>
                    Location / Room:
                    <br />
                    <input
                      type="text"
                      required
                      value={resourceForm.location}
                      onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                    />
                  </label>
                </p>

                <p>
                  <label>
                    Capacity (people/units):
                    <br />
                    <input
                      type="number"
                      min="1"
                      required
                      value={resourceForm.capacity}
                      onChange={(e) => setResourceForm({ ...resourceForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    />
                  </label>
                </p>

                <p>
                  <label>
                    Hourly Rate ($):
                    <br />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={resourceForm.hourlyRate}
                      onChange={(e) => setResourceForm({ ...resourceForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                    />
                  </label>
                </p>

                <p>
                  <label>
                    Description:
                    <br />
                    <textarea
                      rows="3"
                      cols="40"
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    />
                  </label>
                </p>

                <p>
                  <label>
                    <input
                      type="checkbox"
                      checked={resourceForm.availability}
                      onChange={(e) => setResourceForm({ ...resourceForm, availability: e.target.checked })}
                    />
                    {' '}Available for bookings
                  </label>
                </p>

                <p>
                  <button type="submit">Save Resource</button>
                  {' '}
                  <button type="button" onClick={() => setResourceModalOpen(false)}>Cancel</button>
                </p>
              </fieldset>
            </form>
          )}

          <br />

          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Rate/Hr</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.location}</td>
                  <td>{r.capacity}</td>
                  <td>${r.hourlyRate || 0}</td>
                  <td>{r.availability ? 'Available' : 'Unavailable'}</td>
                  <td>
                    <button type="button" onClick={() => openEditResource(r)}>Edit</button>
                    {' '}
                    <button type="button" onClick={() => handleDeleteResource(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div>
          <h2>All Reservation Records ({allBookings.length})</h2>
          {allBookings.length === 0 ? (
            <p>No bookings found in the system.</p>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.resourceName || `Resource #${b.resourceId}`}</td>
                    <td>{b.userName || `User #${b.userId}`}</td>
                    <td>{b.date}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>{b.purpose || 'N/A'}</td>
                    <td><strong>{b.status}</strong></td>
                    <td>
                      {b.status === 'PENDING' && (
                        <>
                          <button type="button" onClick={() => handleBookingAction(b.id, 'CONFIRMED')}>Approve</button>
                          {' '}
                          <button type="button" onClick={() => handleBookingAction(b.id, 'CANCELLED')}>Reject</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button type="button" onClick={() => handleBookingAction(b.id, 'CANCELLED')}>Cancel Booking</button>
                      )}
                      {b.status === 'CANCELLED' && <span>None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* UTILIZATION REPORTS TAB */}
      {activeTab === 'reports' && (
        <div>
          <h2>Resource Utilization & Analytics Report</h2>
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Type</th>
                <th>Total Bookings</th>
                <th>Confirmed Bookings</th>
                <th>Hours Booked</th>
                <th>Utilization Rate</th>
              </tr>
            </thead>
            <tbody>
              {utilizationData.length === 0 ? (
                <tr>
                  <td colSpan="6">No utilization data available.</td>
                </tr>
              ) : (
                utilizationData.map((u, i) => (
                  <tr key={i}>
                    <td>{u.resourceName}</td>
                    <td>{u.type}</td>
                    <td>{u.totalBookings}</td>
                    <td>{u.confirmedBookings}</td>
                    <td>{u.totalHoursBooked} hrs</td>
                    <td>{u.utilizationPercentage ? `${u.utilizationPercentage}%` : '0%'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div>
          <h2>System Audit & Security Logs</h2>
          <p>
            <label>
              Search Logs:
              <br />
              <input
                type="text"
                placeholder="Filter by action, user, or details..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </label>
          </p>

          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity / Resource</th>
                <th>Performed By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5">No audit logs matching query.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                    <td>{log.action}</td>
                    <td>{log.resourceType || 'SYSTEM'}</td>
                    <td>{log.username || 'System'}</td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
