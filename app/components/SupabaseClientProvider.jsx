'use client';

import { createContext, useContext, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const SupabaseContext = createContext(undefined);

export const SupabaseClientProvider = ({ children }) => {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseClient must be used within a SupabaseClientProvider');
  }
  return context;
};
