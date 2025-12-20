'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePictureUpload() {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);

      if (!user) {
        throw new Error('You must be logged in.');
      }

      const file = event.target.files && event.target.files[0];
      if (!file) {
        throw new Error('You must select a picture to upload.');
      }

      // Optional validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB.');
      }

      // Build RLS-safe path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error.message);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload Profile Picture</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}



// 'use client';

// import { useState } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { useAuth } from '@/context/AuthContext';

// export default function ProfilePictureUpload() {
//   const [uploading, setUploading] = useState(false);
//   const { user, session } = useAuth();

//   const handleFileUpload = async (event) => {
//     try {
//       setUploading(true);

//       const file = event.target.files[0];
//       if (!file) {
//         throw new Error('You must select a picture to upload.');
//       }


//     const fileExt = file.name.split('.').pop();
//     const fileName = `avatar.${fileExt}`;
//     const filePath = `${user.id}/${fileName}`;

//     const { error: uploadError } = await supabase.storage
//       .from('profile-pictures') // ✅ correct bucket
//       .upload(filePath, file, { upsert: true });
    
      

//       //const fileExt = file.name.split('.').pop();
//       //const fileName = `${user.id}.${fileExt}`;
//       //const filePath = `profile_pictures/${fileName}`;

//       // const { error: uploadError } = await supabase.storage
//       //   .from('profile_pictures') // Make sure this bucket exists in Supabase
//       //   .upload(filePath, file, { upsert: true });

//       if (uploadError) {
//         throw uploadError;
//       }


//       const { data: { publicUrl } } = supabase.storage
//         .from('profile_pictures')
//         .getPublicUrl(filePath);

//       // Update the user's profile with the new public URL
//       const { error: updateError } = await supabase
//         .from('user_profiles')
//         .update({ profile_picture_url: publicUrl })
//         .eq('id', user.id);

//       if (updateError) {
//         throw updateError;
//       }

//       alert('Profile picture uploaded successfully!');
//       // You may want to manually refetch the user profile or update state here
//       // to see the change immediately.
//     } catch (error) {
//       console.error('Error uploading file:', error.message);
//       alert('Error uploading file: ' + error.message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <h3>Upload Profile Picture</h3>
//       <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
//       {uploading && <p>Uploading...</p>}
//     </div>
//   );
// }

