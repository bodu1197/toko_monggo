// Check RLS policies for product_images table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPolicies() {
  try {
    console.log('\n=== CHECKING product_images TABLE POLICIES ===\n');

    // Query pg_policies to get RLS policies for product_images
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'product_images'
        ORDER BY policyname;
      `
    });

    if (error) {
      console.error('❌ Error querying policies:', error.message);

      // Try alternative approach using information_schema
      console.log('\n⚠️ Trying alternative query...\n');

      const { data: altData, error: altError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'product_images');

      if (altError) {
        console.error('❌ Alternative query also failed:', altError.message);
        console.log('\n💡 Policy 정보를 직접 확인하려면 Supabase Dashboard에서:');
        console.log('   Database > Tables > product_images > Policies 메뉴를 확인하세요.\n');
      }
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No policies found for product_images table\n');
      return;
    }

    console.log('📋 Found policies:\n');
    data.forEach(policy => {
      console.log(`Policy: ${policy.policyname}`);
      console.log(`  Command: ${policy.cmd}`);
      console.log(`  Roles: ${policy.roles}`);
      console.log(`  Using: ${policy.qual || 'N/A'}`);
      console.log(`  With Check: ${policy.with_check || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 RLS Policy를 확인하려면:');
    console.log('1. Supabase Dashboard 접속');
    console.log('2. Database > Tables > product_images');
    console.log('3. Policies 탭 확인');
    console.log('\n관리자가 다른 사용자의 이미지를 수정하려면:');
    console.log('- INSERT/UPDATE/DELETE policy에 관리자 권한 추가 필요\n');
  }
}

checkPolicies();
