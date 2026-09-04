import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sabxyybsadhregtyqrre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYnh5eWJzYWRocmVndHlxcnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ0OTA2NywiZXhwIjoyMTA0MDI1MDY3fQ.Na5PMeTAKl0RL23HnA07_FLzsLh1Rf9JHTKS-pch0Og'
);

// Insert and immediately delete a test row to verify connection
const { error } = await supabase.from('sessions').select('id').limit(1);
console.log('Connection test:', error ? `FAIL — ${error.message}` : 'OK');
