import dotenv from 'dotenv';
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Testing Supabase connection...");
console.log(`URL: ${url}`);
console.log(`Key: ${key?.substring(0, 20)}...`);

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase.from("galaxy_photos").select("*").limit(1);
  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } else {
    console.log("✅ Connection successful!");
    console.log(`📸 Sample data retrieved:`, data);
  }
} catch (err) {
  console.error("❌ Exception:", err.message);
  process.exit(1);
}
