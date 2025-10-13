'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '../components/SupabaseClientProvider';

/**
 * 사용자 인증 상태를 확인하고 사용자 정보를 반환하는 커스텀 훅
 * @param {object} options - 옵션 객체
 * @param {string} [options.redirectTo] - 비로그인 시 리디렉션할 경로 (기본값: '/login')
 * @returns {{ user: object | null, profile: object | null, loading: boolean }}
 */
export function useAuth({ redirectTo = '/login' } = {}) {
  const router = useRouter();
  const supabase = useSupabaseClient(); // Get the client instance here
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
            setLoading(false); // Only set loading to false if we have a valid session
          }

        } else {
          // 세션 없으면 리디렉션 (loading을 true로 유지하여 페이지 내용이 보이지 않도록)
          if (isMounted) {
            router.replace(redirectTo);
            // Don't set loading to false - keep showing loading state during redirect
          }
        }
      } catch (error) {
        console.error('Error in useAuth:', error);
        if (isMounted) {
          router.replace(redirectTo);
          // Don't set loading to false - keep showing loading state during redirect
        }
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo, supabase]); // Add supabase to dependency array

  return { user, profile, loading, setProfile };
}
