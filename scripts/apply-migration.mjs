import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://zthksbitvezxwhbymatz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aGtzYml0dmV6eHdoYnltYXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTAxNzIsImV4cCI6MjA3NTY4NjE3Mn0.YYnQBB3vjDe8-DsAl4CHgc_WplKYnmP79DpRA85K5FU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20251011220537_fix_nearby_products_price_type.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('🚀 Applying migration: fix_nearby_products_price_type');
console.log('📄 SQL:', sql.substring(0, 100) + '...');

// Execute SQL using RPC
try {
  // We need to use a different approach - call the SQL directly
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  console.log('📊 Result:', data);
} catch (err) {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
}
