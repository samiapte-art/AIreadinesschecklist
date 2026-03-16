import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if it's the placeholder from .env or truly missing, fallback to valid URL format to prevent crash
const isPlaceholderUrl = !supabaseUrl || supabaseUrl === 'your_project_url_here';

export const supabase = createClient(
  isPlaceholderUrl ? 'https://placeholder.supabase.co' : supabaseUrl, 
  supabaseKey || 'placeholder-anon-key'
);
