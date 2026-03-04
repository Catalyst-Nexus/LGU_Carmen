# Current Supabase Integration

## Current Setup
- Supabase client created in `src/lib/supabase.ts`
- Client initialized from environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Image upload utilities in `src/lib/imageUpload.ts`
- Falls back to local storage (demo mode) if Supabase not configured
- Both buckets required: `system_logo` and `profile_picture`

## Available Functions
- `uploadImage(file, bucket, path?)` - Upload images to Supabase Storage
- `deleteImage(bucket, path)` - Delete images from Supabase Storage
- `isSupabaseConfigured()` - Check if Supabase is properly configured
- `supabase` - Supabase client instance (or null if not configured)

## Current Status
- `.env.example` exists with template
- `.env` file needs to be created manually with self-hosted instance credentials
- Project is ready to connect to self-hosted Supabase
- Authentication system in place (uses localStorage currently, can be enhanced with Supabase Auth)

## Documentation
- `SUPABASE_SETUP.md` contains setup guide for standard Supabase Cloud
- Needs adaptation for self-hosted instance
