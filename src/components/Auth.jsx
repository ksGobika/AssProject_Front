import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export const Auth = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    department: 'Computer Science',
    role: 'STUDENT',
  });

  const handleQuickFill = (u, p) => {
    setLoginData({ username: u, password: p });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.login(loginData);
      if (res.success && res.data) {
        login(res.data);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.register(registerData);
      if (res.success) {
        setSuccessMsg(res.message || 'Registration submitted! Please wait for Admin approval.');
        setIsRegister(false);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div>
        <h2>Campus Smart Resource Management System (CSRM)</h2>
        <p>Centralized Operations Portal</p>
        <hr />

        <div>
          <button
            type="button"
            disabled={!isRegister}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Sign In
          </button>
          {' '}
          <button
            type="button"
            disabled={isRegister}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Register
          </button>
        </div>

        <br />

        {!isRegister && (
          <fieldset>
            <legend>Fast Evaluation Demo Logins</legend>
            <p>Click to prefill credentials:</p>
            <button type="button" onClick={() => handleQuickFill('admin', 'admin123')}>
              Admin (admin / admin123)
            </button>
            {' '}
            <button type="button" onClick={() => handleQuickFill('faculty', 'faculty123456')}>
              Faculty (faculty / faculty123456)
            </button>
            {' '}
            <button type="button" onClick={() => handleQuickFill('student', 'password123456')}>
              Student (student / password123456)
            </button>
          </fieldset>
        )}

        <br />

        {error && (
          <div>
            <strong>Error: </strong>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div>
            <strong>Success: </strong>
            <span>{successMsg}</span>
          </div>
        )}

        {(error || successMsg) && <br />}

        {!isRegister ? (
          <form onSubmit={handleLoginSubmit}>
            <fieldset>
              <legend>Sign In</legend>
              <p>
                <label>
                  Username:
                  <br />
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Password:
                  <br />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <button type="submit" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </p>
            </fieldset>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <fieldset>
              <legend>Create an Account</legend>

              <p>
                <label>
                  Account Role:
                  <br />
                  <select
                    value={registerData.role}
                    onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member</option>
                  </select>
                </label>
              </p>

              <p>
                <label>
                  Full Name:
                  <br />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Email Address:
                  <br />
                  <input
                    type="email"
                    required
                    placeholder="name@campus.edu"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Username:
                  <br />
                  <input
                    type="text"
                    required
                    placeholder="Choose username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Password:
                  <br />
                  <input
                    type="password"
                    required
                    placeholder="Choose password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <label>
                  Department:
                  <br />
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                  />
                </label>
              </p>

              <p>
                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting Registration...' : 'Register Account'}
                </button>
              </p>
              <small>* New accounts require Administrator approval before logging in.</small>
            </fieldset>
          </form>
        )}
      </div>
    </main>
  );
};
