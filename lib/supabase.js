import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ydabrgqvvlxfzkwmcbwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWJyZ3F2dmx4Znprd21jYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzc5MzEsImV4cCI6MjA5MDc1MzkzMX0.-y5nobEcamDDB4LtHSCm0GtfRmyqIJBLCFDy0eMD1J8',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)