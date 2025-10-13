import { createClientComponentClient } from '@supabase/ssr';

/**
 * Supabase 클라이언트 컴포넌트 클라이언트 인스턴스
 * @description 이 클라이언트는 클라이언트 컴포넌트에서 사용하기 위해 만들어졌습니다.
 * 모든 클라이언트 컴포넌트에서 이 인스턴스를 import하여 사용하세요.
 */
export const supabase = createClientComponentClient();
