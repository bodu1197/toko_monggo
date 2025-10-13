// Check if DB provinces match regions.js
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

async function checkRegions() {
  try {
    // Get provinces from DB
    const { data: dbProvinces, error } = await supabase
      .from('provinces')
      .select('province_name')
      .order('province_name');

    if (error) throw error;

    const dbProvinceNames = dbProvinces.map(p => p.province_name).sort();

    // Load regions.js
    const regionsPath = path.join(__dirname, '../app/data/regions.js');
    const regionsContent = fs.readFileSync(regionsPath, 'utf8');

    // Extract province names from INDONESIA_REGIONS object keys
    const jsProvinceNames = [];
    const regex = /'([^']+)':\s*\[/g;
    let match;
    while ((match = regex.exec(regionsContent)) !== null) {
      jsProvinceNames.push(match[1]);
    }
    jsProvinceNames.sort();

    console.log('\n=== COMPARISON RESULT ===\n');
    console.log('DB Provinces:', dbProvinceNames.length);
    console.log('JS Provinces:', jsProvinceNames.length);
    console.log('\n');

    // Find differences
    const inDbNotInJs = dbProvinceNames.filter(p => !jsProvinceNames.includes(p));
    const inJsNotInDb = jsProvinceNames.filter(p => !dbProvinceNames.includes(p));

    if (inDbNotInJs.length > 0) {
      console.log('❌ In DB but NOT in regions.js:');
      inDbNotInJs.forEach(p => console.log(`   - ${p}`));
      console.log('\n');
    }

    if (inJsNotInDb.length > 0) {
      console.log('❌ In regions.js but NOT in DB:');
      inJsNotInDb.forEach(p => console.log(`   - ${p}`));
      console.log('\n');
    }

    if (inDbNotInJs.length === 0 && inJsNotInDb.length === 0) {
      console.log('✅ Perfect match! All provinces are synchronized.\n');
    }

    // Show all provinces side by side
    console.log('=== ALL PROVINCES ===\n');
    const maxLength = Math.max(dbProvinceNames.length, jsProvinceNames.length);

    console.log('DB                                          | regions.js');
    console.log('--------------------------------------------+--------------------------------------------');

    for (let i = 0; i < maxLength; i++) {
      const db = dbProvinceNames[i] || '';
      const js = jsProvinceNames[i] || '';
      const match = db === js ? '✅' : '❌';
      console.log(`${match} ${db.padEnd(40)} | ${js}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRegions();
