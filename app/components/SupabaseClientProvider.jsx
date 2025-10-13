'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/ssr';

const SupabaseContext = createContext(undefined);

export const SupabaseClientProvider = ({ children }) => {
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    setSupabase(createClientComponentClient());
  }, []);

  if (!supabase) {
    return null; // Or a loading spinner
  }

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
