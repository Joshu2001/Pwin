import { useState, useEffect } from 'react';
import { X, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);
  const [nextEmployeeId, setNextEmployeeId] = useState(null);
  const [statusCheckEmail, setStatusCheckEmail] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    employeeId: '',
    password1: '',
    password2: '',
    password3: ''
  });

  // Signup form
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password1: '',
    password2: '',
    password3: ''
  });

  // On mount: restore remembered credentials and auto-login if session exists
  useEffect(() => {
    // Check for existing valid session — auto-login without showing modal
    try {
      const savedSession = localStorage.getItem('staffSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session && session.employeeId) {
          // Session exists — auto-restore login
          if (onLoginSuccess) onLoginSuccess(session);
          if (onClose) onClose();
          return;
        }
      }
    } catch { }

    // Restore remembered credentials
    try {
      const saved = localStorage.getItem('staffRememberedCredentials');
      if (saved) {
        const creds = JSON.parse(saved);
        if (creds && creds.employeeId) {
          setLoginData(creds);
          setRememberMe(true);
        }
      }
    } catch { }
  }, []);

  // Fetch next employee ID when switching to signup mode
  useEffect(() => {
    if (mode === 'signup' && nextEmployeeId === null) {
      fetchNextEmployeeId();
    }
  }, [mode]);

  const fetchNextEmployeeId = async () => {
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const res = await fetch(`${BACKEND}/staff/next-employee-id`);
      const data = await res.json();
      if (data.nextEmployeeId) {
        setNextEmployeeId(data.nextEmployeeId);
      }
    } catch (err) {
      console.error('Error fetching next employee ID:', err);
    }
  };

  const checkAccountStatus = async (email) => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsCheckingStatus(true);
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const res = await fetch(`${BACKEND}/staff/check-account-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      
      if (data.status === 'approved') {
        setAccountStatus({
          status: 'approved',
          message: `✅ ${data.message}`,
          type: 'success',
          employeeId: data.employeeId
        });
      } else if (data.status === 'pending') {
        setAccountStatus({
          status: 'pending',
          message: `⏳ ${data.message}`,
          type: 'info'
        });
      } else if (data.status === 'denied') {
        setAccountStatus({
          status: 'denied',
          message: `❌ ${data.message}`,
          type: 'error'
        });
      } else {
        setAccountStatus({
          status: 'not_found',
          message: `❓ ${data.message}`,
          type: 'info'
        });
      }
    } catch (err) {
      setError('Failed to check status');
      console.error('Error checking account status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Auto-poll for status when signup is successful
  useEffect(() => {
    if (accountStatus?.status === 'pending' && statusCheckEmail) {
      const interval = setInterval(() => {
        checkAccountStatus(statusCheckEmail);
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [accountStatus?.status, statusCheckEmail]);

  const handleLogin = async () => {
    setError('');
    setSuccessMessage('');

    if (!loginData.employeeId || !loginData.password1 || !loginData.password2 || !loginData.password3) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const res = await fetch(`${BACKEND}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store staff session (persists until manual logout)
      localStorage.setItem('staffSession', JSON.stringify(data.employee));

      // Save or clear remembered credentials based on Remember Me checkbox
      if (rememberMe) {
        localStorage.setItem('staffRememberedCredentials', JSON.stringify(loginData));
      } else {
        localStorage.removeItem('staffRememberedCredentials');
      }

      onLoginSuccess(data.employee);
      onClose();
    } catch (err) {
      setError('Connection error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    setSuccessMessage('');

    if (!signupData.name || !signupData.email || 
        !signupData.password1 || !signupData.password2 || !signupData.password3) {
      setError('All fields are required');
      return;
    }

    if (!signupData.email.includes('@')) {
      setError('Invalid email address');
      return;
    }

    setLoading(true);
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
      const res = await fetch(`${BACKEND}/staff/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Store email and start status checking
      setStatusCheckEmail(signupData.email);
      setSuccessMessage('Account request submitted. Awaiting Executive approval.');
      
      // Start checking status
      checkAccountStatus(signupData.email);
      
      // Don't auto-switch mode anymore, let user see status updates
      setSignupData({
        name: '',
        email: '',
        password1: '',
        password2: '',
        password3: ''
      });
    } catch (err) {
      setError('Connection error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      cursor: 'pointer'
    }} onClick={(e) => {
      // Close modal if clicked on the backdrop (not the modal itself)
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        cursor: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            {mode === 'login' ? 'Staff Login' : 'Create Staff Account'}
          </h2>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '14px',
            alignItems: 'center'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '12px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#16a34a',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {accountStatus && (
          <div style={{
            padding: '12px',
            backgroundColor: accountStatus.type === 'success' ? '#dcfce7' : 
                            accountStatus.type === 'error' ? '#fee2e2' : '#dbeafe',
            border: accountStatus.type === 'success' ? '1px solid #86efac' : 
                   accountStatus.type === 'error' ? '1px solid #fca5a5' : '1px solid #7dd3fc',
            borderRadius: '8px',
            marginBottom: '16px',
            color: accountStatus.type === 'success' ? '#16a34a' : 
                   accountStatus.type === 'error' ? '#dc2626' : '#0369a1',
            fontSize: '14px'
          }}>
            {accountStatus.message}
            {accountStatus.status === 'pending' && (
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                Checking status... (refreshes every 3 seconds)
              </div>
            )}
          </div>
        )}

        {mode === 'login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Employee ID"
              value={loginData.employeeId}
              onChange={(e) => setLoginData({ ...loginData, employeeId: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword1 ? "text" : "password"}
                placeholder="Password 1"
                value={loginData.password1}
                onChange={(e) => setLoginData({ ...loginData, password1: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword1(!showPassword1)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword1 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword2 ? "text" : "password"}
                placeholder="Password 2"
                value={loginData.password2}
                onChange={(e) => setLoginData({ ...loginData, password2: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword2(!showPassword2)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword3 ? "text" : "password"}
                placeholder="Password 3"
                value={loginData.password3}
                onChange={(e) => setLoginData({ ...loginData, password3: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword3(!showPassword3)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword3 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Remember Me checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px 0'
            }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: rememberMe ? '2px solid #3b82f6' : '2px solid #d1d5db',
                  backgroundColor: rememberMe ? '#3b82f6' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {rememberMe && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span onClick={() => setRememberMe(!rememberMe)}>Remember Me</span>
            </label>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#666'
            }}>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Create one
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              backgroundColor: '#f9fafb',
              color: '#666'
            }}>
              Employee ID: <strong>{nextEmployeeId || 'Loading...'}</strong>
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
            <input
              type="email"
              placeholder="Email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword1 ? "text" : "password"}
                placeholder="Password 1"
                value={signupData.password1}
                onChange={(e) => setSignupData({ ...signupData, password1: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword1(!showPassword1)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword1 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword2 ? "text" : "password"}
                placeholder="Password 2"
                value={signupData.password2}
                onChange={(e) => setSignupData({ ...signupData, password2: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword2(!showPassword2)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword3 ? "text" : "password"}
                placeholder="Password 3"
                value={signupData.password3}
                onChange={(e) => setSignupData({ ...signupData, password3: e.target.value })}
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword3(!showPassword3)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: 0
                }}
              >
                {showPassword3 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleSignup}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <button
              onClick={() => setMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
