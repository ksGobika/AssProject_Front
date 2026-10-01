import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourceAPI, bookingAPI } from '../services/api';

export const UserDashboard = ({ activeTab, setActiveTab }) => {
  const { user, refreshNotifications } = useAuth();

  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    purpose: '',
    requestedServices: 'None',
  });

  const [conflictState, setConflictState] = useState({ checking: false, checked: false, hasConflict: false, message: '' });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchResources();
    fetchMyBookings();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await resourceAPI.getAll();
      if (res.success && res.data) {
        setResources(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      if (res.success && res.data) {
        setMyBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const openBookModal = (resource) => {
    setSelectedResource(resource);
    setIsEditMode(false);
    setEditBookingId(null);
    setBookingForm({
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      purpose: '',
      requestedServices: 'None',
    });
    setConflictState({ checking: false, checked: false, hasConflict: false, message: '' });
    setActionError('');
    setActionSuccess('');
    setBookingModalOpen(true);
  };

  const openEditModal = (booking) => {
    const resObj = resources.find((r) => r.id === booking.resourceId) || {
      id: booking.resourceId,
      name: booking.resourceName,
      type: 'RESOURCE',
      location: 'Campus'
    };
    setSelectedResource(resObj);
    setIsEditMode(true);
    setEditBookingId(booking.id);
    setBookingForm({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose || '',
      requestedServices: booking.requestedServices || 'None',
    });
    setConflictState({ checking: false, checked: false, hasConflict: false, message: '' });
    setActionError('');
    setActionSuccess('');
    setBookingModalOpen(true);
  };

  const handleCheckConflict = async () => {
    if (!selectedResource) return;
    setConflictState({ checking: true, checked: false, hasConflict: false, message: '' });
    try {
      const res = await bookingAPI.checkConflict({
        resourceId: selectedResource.id,
        date: bookingForm.date,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        excludeBookingId: editBookingId || null,
      });

      if (res.data?.hasConflict) {
        setConflictState({
          checking: false,
          checked: true,
          hasConflict: true,
          message: res.data.message || 'Time slot overlaps with another reservation!',
        });
      } else {
        setConflictState({
          checking: false,
          checked: true,
          hasConflict: false,
          message: 'Slot is completely available!',
        });
      }
    } catch (err) {
      setConflictState({
        checking: false,
        checked: true,
        hasConflict: true,
        message: err.message || 'Error running conflict check',
      });
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      if (isEditMode) {
        const res = await bookingAPI.updateBooking(editBookingId, {
          date: bookingForm.date,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          purpose: bookingForm.purpose,
          requestedServices: bookingForm.requestedServices,
        });
        if (res.success) {
          setActionSuccess('Reservation updated successfully!');
          setBookingModalOpen(false);
          fetchMyBookings();
          refreshNotifications();
        } else {
          setActionError(res.message || 'Failed to update reservation');
        }
      } else {
        const res = await bookingAPI.createBooking({
          resourceId: selectedResource.id,
          date: bookingForm.date,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          purpose: bookingForm.purpose,
          requestedServices: bookingForm.requestedServices,
        });
        if (res.success) {
          setActionSuccess('Booking submitted! Waiting for admin confirmation.');
          setBookingModalOpen(false);
          fetchMyBookings();
          refreshNotifications();
          if (setActiveTab) setActiveTab('my-bookings');
        } else {
          setActionError(res.message || 'Failed to create booking');
        }
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await bookingAPI.cancelBooking(id);
      if (res.success) {
        setActionSuccess('Booking cancelled successfully');
        fetchMyBookings();
        refreshNotifications();
      } else {
        setActionError(res.message || 'Could not cancel booking');
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchCat = selectedCategory === 'ALL' || r.type === selectedCategory;
    const matchSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section>
      {actionSuccess && (
        <div>
          <p><strong>Success:</strong> {actionSuccess} <button type="button" onClick={() => setActionSuccess('')}>x</button></p>
        </div>
      )}
      {actionError && (
        <div>
          <p><strong>Error:</strong> {actionError} <button type="button" onClick={() => setActionError('')}>x</button></p>
        </div>
      )}

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div>
          <h2>Available Campus Resources</h2>

          <p>
            <label>
              Search Resources:
              <br />
              <input
                type="text"
                placeholder="Search by name, room, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </p>

          <p>
            Filter by Category:{' '}
            {['ALL', 'CLASSROOM', 'LAB', 'EQUIPMENT', 'LOCKER'].map((cat) => (
              <button
                key={cat}
                type="button"
                disabled={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </p>

          {loading ? (
            <p>Loading resource catalog...</p>
          ) : filteredResources.length === 0 ? (
            <p>No resources match your selection.</p>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Rate/Hr</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.type}</td>
                    <td>{r.location}</td>
                    <td>{r.capacity} people/units</td>
                    <td>${r.hourlyRate || 0}</td>
                    <td>{r.description || 'N/A'}</td>
                    <td>{r.availability ? 'Available' : 'Unavailable'}</td>
                    <td>
                      <button
                        type="button"
                        disabled={!r.availability}
                        onClick={() => openBookModal(r)}
                      >
                        {r.availability ? 'Book Now' : 'Unavailable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MY RESERVATIONS TAB */}
      {activeTab === 'my-bookings' && (
        <div>
          <h2>My Reservations ({myBookings.length})</h2>

          {bookingsLoading ? (
            <p>Loading your reservations...</p>
          ) : myBookings.length === 0 ? (
            <div>
              <p>You have not made any reservations yet.</p>
              <button type="button" onClick={() => setActiveTab('catalog')}>
                Go to Resource Catalog
              </button>
            </div>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.resourceName || `Resource #${b.resourceId}`}</td>
                    <td>{b.date}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>{b.purpose || 'N/A'}</td>
                    <td>{b.requestedServices || 'None'}</td>
                    <td><strong>{b.status}</strong></td>
                    <td>
                      {b.status !== 'CANCELLED' && (
                        <>
                          <button type="button" onClick={() => openEditModal(b)}>
                            Edit
                          </button>
                          {' '}
                          <button type="button" onClick={() => handleCancelBooking(b.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {b.status === 'CANCELLED' && <span>Cancelled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* BOOKING MODAL / FORM */}
      {bookingModalOpen && selectedResource && (
        <div>
          <hr />
          <form onSubmit={handleSubmitBooking}>
            <fieldset>
              <legend>
                {isEditMode ? `Edit Reservation #${editBookingId}` : `Reserve: ${selectedResource.name}`}
              </legend>

              <p>
                <strong>Resource:</strong> {selectedResource.name} ({selectedResource.type}) - Location: {selectedResource.location}
              </p>

              <p>
                <label>
                  Reservation Date:
                  <br />
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Start Time:
                  <br />
                  <input
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  End Time:
                  <br />
                  <input
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <button type="button" onClick={handleCheckConflict} disabled={conflictState.checking}>
                  {conflictState.checking ? 'Checking conflict...' : 'Check Availability Conflict'}
                </button>
              </p>

              {conflictState.checked && (
                <p>
                  <strong>Conflict Check Result: </strong>
                  <span>{conflictState.message}</span>
                </p>
              )}

              <p>
                <label>
                  Purpose / Justification:
                  <br />
                  <textarea
                    rows="2"
                    cols="40"
                    placeholder="e.g. CS201 Lab Lecture, Team Meeting..."
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Additional Services Requested:
                  <br />
                  <select
                    value={bookingForm.requestedServices}
                    onChange={(e) => setBookingForm({ ...bookingForm, requestedServices: e.target.value })}
                  >
                    <option value="None">None</option>
                    <option value="Projector & AV Setup">Projector & AV Setup</option>
                    <option value="Lab Technician Support">Lab Technician Support</option>
                    <option value="Extra Seating & Whiteboard">Extra Seating & Whiteboard</option>
                  </select>
                </label>
              </p>

              <p>
                <button type="submit">
                  {isEditMode ? 'Update Reservation' : 'Confirm & Submit Booking'}
                </button>
                {' '}
                <button type="button" onClick={() => setBookingModalOpen(false)}>
                  Cancel
                </button>
              </p>
            </fieldset>
          </form>
          <hr />
        </div>
      )}
    </section>
  );
};
