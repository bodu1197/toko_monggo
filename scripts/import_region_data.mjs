
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- IMPORTANT: CREDENTIALS ---
// 환경변수에서 Supabase 정보를 로드합니다.
// .env.local 파일에 다음 값을 설정하세요:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY (또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)
//
// 실행: node -r dotenv/config scripts/import_region_data.mjs dotenv_config_path=.env.local
//
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Starting region data import...');
  console.log('This script will DELETE all existing provinces and regencies and replace them with new data.');
  console.log('------------------------------------------------------------------------------------');

  try {
    // 1. Read and Parse CSV files
    console.log('1/4: Reading and parsing CSV files...');
    const provincesPath = join(__dirname, '..', 'provinces.csv');
    const regenciesPath = join(__dirname, '..', 'regencies.csv');
    const provincesCsv = readFileSync(provincesPath, 'utf-8');
    const regenciesCsv = readFileSync(regenciesPath, 'utf-8');

    const provinces = provincesCsv.split('\n').filter(Boolean).map(line => {
      const [id, name] = line.split(',');
      return { province_id: parseInt(id), province_name: name };
    });

    const regencies = regenciesCsv.split('\n').filter(Boolean).map(line => {
      const [id, prov_id, name] = line.split(',');
      return { regency_id: parseInt(id), province_id: parseInt(prov_id), regency_name: name };
    });
    console.log(`✅ Found ${provinces.length} provinces and ${regencies.length} regencies.`);

    // 2. Delete existing data
    // We delete from regencies first due to the foreign key constraint from provinces.
    console.log('2/4: Deleting existing data from tables...');
    const { error: deleteRegenciesError } = await supabase.from('regencies').delete().gt('regency_id', 0);
    if (deleteRegenciesError) {
      console.error('❌ Error deleting regencies:', deleteRegenciesError.message);
      console.error('\n⚠️ IMPORTANT: The script failed, most likely due to insufficient permissions. Please read the "IMPORTANT: CREDENTIALS" notice at the top of this script and try again with a SERVICE_ROLE key.');
      return;
    }

    const { error: deleteProvincesError } = await supabase.from('provinces').delete().gt('province_id', 0);
    if (deleteProvincesError) {
      console.error('❌ Error deleting provinces:', deleteProvincesError.message);
      return;
    }
    console.log('✅ Existing data deleted successfully.');

    // 3. Insert new provinces
    console.log('3/4: Inserting new provinces...');
    const { error: insertProvincesError } = await supabase.from('provinces').insert(provinces);
    if (insertProvincesError) {
      console.error('❌ Error inserting provinces:', insertProvincesError.message);
      return;
    }
    console.log('✅ Provinces inserted successfully.');

    // 4. Insert new regencies in chunks
    console.log('4/4: Inserting new regencies (this may take a moment)...');
    const chunkSize = 500;
    for (let i = 0; i < regencies.length; i += chunkSize) {
      const chunk = regencies.slice(i, i + chunkSize);
      const { error: insertRegenciesError } = await supabase.from('regencies').insert(chunk);
      if (insertRegenciesError) {
        console.error(`❌ Error inserting regencies chunk ${Math.floor(i / chunkSize) + 1}:`, insertRegenciesError.message);
        return;
      }
      console.log(`  -> Chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(regencies.length / chunkSize)} inserted.`);
    }
    console.log('✅ Regencies inserted successfully.');

    console.log('\n🎉🎉🎉 Data import complete! Your database is now up to date. 🎉🎉🎉');

  } catch (error) {
    console.error('\nAn unexpected error occurred:', error.message);
  }
}

main();
