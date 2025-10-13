'use client';

import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/ssr';

const getSessionId = () => {
  let sessionId = localStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

const hasLoggedToday = () => {
  const lastLog = localStorage.getItem('last_access_log_date');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return lastLog === today;
};

const markLoggedToday = () => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('last_access_log_date', today);
};

export default function LocationTracker() {
  const supabase = createClientComponentClient();

  const saveAccessWithoutLocation = useCallback(async (sessionId, userId, userAgent, pageUrl) => {
    try {
      const { error } = await supabase
        .from('access_logs')
        .upsert({
          session_id: sessionId,
          user_id: userId || null,
          user_agent: userAgent,
          page_url: pageUrl,
          access_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'session_id,access_date'
        });

      if (error) {
        console.error('Error saving access log without location:', error);
      } else {
        console.log('✅ Access logged without location');
        markLoggedToday();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [supabase]); // supabase is a stable dependency

  const trackAccess = useCallback(async () => {
    try {
      // 오늘 이미 기록했으면 스킵
      if (hasLoggedToday()) {
        console.log('📊 Already logged today, skipping...');
        return;
      }

      // Get current user (may be null for guests)
      const { data: { user } } = await supabase.auth.getUser();

      // Get session ID
      const sessionId = getSessionId();

      // Get user agent
      const userAgent = navigator.userAgent;
      const pageUrl = window.location.href;

      // Get geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Save to database with UPSERT (하루에 한 번만)
            const { error } = await supabase
              .from('access_logs')
              .upsert({
                session_id: sessionId,
                user_id: user?.id || null,
                latitude: latitude,
                longitude: longitude,
                user_agent: userAgent,
                page_url: pageUrl,
                access_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
              }, {
                onConflict: 'session_id,access_date' // 중복되면 업데이트
              });

            if (error) {
              console.error('Error saving access log:', error);
            } else {
              console.log('✅ Access logged with location:', user ? 'User' : 'Guest');
              markLoggedToday(); // 오늘 기록 완료 표시
            }
          },
          (error) => {
            // User denied location or error occurred
            console.warn('Geolocation error:', error.message);

            // Save without location
            saveAccessWithoutLocation(sessionId, user?.id || null, userAgent, pageUrl);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      } else {
        // Geolocation not supported
        saveAccessWithoutLocation(sessionId, user?.id || null, userAgent, pageUrl);
      }
    } catch (error) {
      console.error('Error tracking access:', error);
    }
  }, [supabase, saveAccessWithoutLocation]);

  useEffect(() => {
    trackAccess();
  }, [trackAccess]);

  // This component doesn't render anything
  return null;
}
