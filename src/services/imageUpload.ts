import { supabase, isSupabaseConfigured } from './supabase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name ('system_logo' or 'profile_picture')
 * @param path - Optional path/filename in the bucket
 * @returns Upload result with URL or error
 */
export const uploadImage = async (
  file: File,
  bucket: 'system_logo' | 'profile_picture',
  path?: string
): Promise<UploadResult> => {
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Running in demo mode - images stored locally')
    // Return a mock URL for demo purposes
    return {
      success: true,
      url: URL.createObjectURL(file),
    }
  }

  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size too large. Maximum size is 5MB' }
    }

    // Generate unique filename if not provided
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${timestamp}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Replace if file exists
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Delete an image from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns Success status
 */
export const deleteImage = async (
  bucket: 'system_logo' | 'profile_picture',
  path: string
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    return true
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * Get public URL for an image
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns Public URL or null
 */
export const getImageUrl = (
  bucket: 'system_logo' | 'profile_picture',
  path: string
): string | null => {
  if (!isSupabaseConfigured() || !supabase) {
    return null
  }

  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  } catch (error) {
    console.error('Get URL error:', error)
    return null
  }
}
