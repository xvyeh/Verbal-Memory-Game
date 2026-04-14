import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqactnyarkkekdymukh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWFjdG55YXJra2VrZHltdWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzY0NDgsImV4cCI6MjA5MTc1MjQ0OH0.LJiZBYvONHOqHqkkFYHfDf7Grr-MJrkwS9rukhFKrl8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
