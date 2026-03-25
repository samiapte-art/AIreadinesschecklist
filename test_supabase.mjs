import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkoshyviwvzjokvdzozi.supabase.co';
const supabaseKey = 'sb_publishable_cBVUNYNfrJ2bKKP8D92sFg_d6Q-V9Aj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase checklist_json insert/update...');
  
  // Try inserting a dummy record with checklist_json
  const { data, error } = await supabase
    .from('client_submissions')
    .insert([{ 
      client_name: 'Test', 
      client_website: 'test.com', 
      opportunities_json: [],
      checklist_json: { "test": true }
    }]);
    
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

test();
