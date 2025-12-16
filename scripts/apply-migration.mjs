import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials - 환경변수에서 로드
// 주의: 이 스크립트는 현재 사용되지 않음. Supabase CLI 또는 Dashboard 사용 권장
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tshngfzijqfuplzvmpoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
