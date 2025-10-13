'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import getSupabaseClient from '../lib/supabase/client';

/**
 * 사용자 인증 상태를 확인하고 사용자 정보를 반환하는 커스텀 훅
 * @param {object} options - 옵션 객체
 * @param {string} [options.redirectTo] - 비로그인 시 리디렉션할 경로 (기본값: '/login')
 * @returns {{ user: object | null, profile: object | null, loading: boolean }}
 */
export function useAuth({ redirectTo = '/login' } = {}) {
  const router = useRouter();
  const supabase = getSupabaseClient(); // Get the client instance here
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          if (!isMounted) return;
          setUser(session.user);

          // 프로필 정보 가져오기
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn('Failed to fetch profile:', profileError);
          }
          
          if (isMounted) {
            setProfile(profileData || null);
          }

        } else {
          // 세션 없으면 리디렉션
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error('Error in useAuth:', error);
        if (isMounted) {
          router.replace(redirectTo);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo]);

  return { user, profile, loading };
}
