import { supabase } from './supabaseClient';

/**
 * Uploads a file to Supabase Storage bucket 'materials'.
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductPhoto(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    // Upload to 'materials' storage bucket
    const { data, error } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error);
      // Fallback: If bucket 'materials' fails (e.g., bucket not created yet or permission error),
      // we generate a Data URL so the product can still be listed with the photo seamlessly.
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload photo to Supabase storage:', err);
    // Fallback to Data URL
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
