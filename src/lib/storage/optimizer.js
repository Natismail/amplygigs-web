import sharp from 'sharp'; // Image compression

/**
 * Compress images before upload
 */
export async function compressImage(file, quality = 80) {
  if (!file.type.startsWith('image/')) return file;
  
  const buffer = await file.arrayBuffer();
  
  const compressed = await sharp(Buffer.from(buffer))
    .resize(1920, 1080, { // Max dimensions
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality }) // Convert to JPEG
    .toBuffer();
  
  return new File([compressed], file.name, { type: 'image/jpeg' });
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(file) {
  if (!file.type.startsWith('image/')) return null;
  
  const buffer = await file.arrayBuffer();
  
  const thumbnail = await sharp(Buffer.from(buffer))
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
  
  return thumbnail;
}

/**
 * Clean up old files (run as cron job)
 */
export async function cleanupOldMedia(supabase, daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  // Find old chat media
  const { data: oldFiles } = await supabase.storage
    .from('chat-media')
    .list('', {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'asc' },
    });
  
  const filesToDelete = oldFiles?.filter(
    file => new Date(file.created_at) < cutoffDate
  );
  
  if (filesToDelete && filesToDelete.length > 0) {
    await supabase.storage
      .from('chat-media')
      .remove(filesToDelete.map(f => f.name));
  }
  
  console.log(`Cleaned up ${filesToDelete?.length || 0} old files`);
}