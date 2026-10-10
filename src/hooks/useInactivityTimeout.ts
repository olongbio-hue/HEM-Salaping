import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minit
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minit sebelum tamat (minit ke-28)

export function useInactivityTimeout() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useSchool();
  const navigate = useNavigate();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningModal) {
      setShowWarningModal(false);
    }
  }, [showWarningModal]);

  const handlePerformLogout = useCallback(() => {
    setShowWarningModal(false);
    logout();
    showToast(
      'Sesi anda telah tamat secara automatik selepas 30 minit tidak aktif demi keselamatan data peribadi murid.',
      'info'
    );
    navigate('/login');
  }, [logout, showToast, navigate]);

  useEffect(() => {
    if (!currentUser) {
      setShowWarningModal(false);
      return;
    }

    // Reset last activity on mounting
    lastActivityRef.current = Date.now();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const onUserActivity = () => {
      // Hanya reset jika modal amaran belum dipaparkan
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    activityEvents.forEach(evt => window.addEventListener(evt, onUserActivity, { passive: true }));

    // Check timer every 10 seconds
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handlePerformLogout();
      } else if (elapsed >= INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS && !showWarningModal) {
        setShowWarningModal(true);
        setSecondsRemaining(Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
      }
    }, 10000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, onUserActivity));
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentUser, showWarningModal, handlePerformLogout]);

  // Countdown when warning is showing
  useEffect(() => {
    if (showWarningModal) {
      countdownRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handlePerformLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarningModal, handlePerformLogout]);

  const keepSessionAlive = () => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);
    showToast('Sesi anda telah disambung.', 'success');
  };

  return {
    showWarningModal,
    secondsRemaining,
    keepSessionAlive,
    handlePerformLogout
  };
}
