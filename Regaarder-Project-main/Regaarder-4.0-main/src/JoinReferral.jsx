import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * JoinReferral – Landing page for referral links (/join?code=XXX).
 * Captures the referral code, persists it in localStorage so the
 * signup form can pre-fill it, then redirects to the home page
 * with a flag that triggers the auth/signup modal.
 */
export default function JoinReferral() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      localStorage.setItem('regaarder_pending_referral', code);
    }
    // Navigate to home with state so Home can auto-open the signup modal
    navigate('/', { replace: true, state: { openSignup: true, referralCode: code || '' } });
  }, [searchParams, navigate]);

  // Brief fallback while the redirect fires
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif'
    }}>
      <p style={{ fontSize: '16px', opacity: 0.7 }}>Redirecting…</p>
    </div>
  );
}
