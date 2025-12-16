'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

export default function MusicianProfilePage() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        primary_role: user.primary_role || '',
        genres: user.genres || [],
        experience_years: user.experience_years || '',
        hourly_rate: user.hourly_rate || '',
        availability: user.availability || 'available',
        gadget_specs: user.gadget_specs || '',
        youtube: user.youtube || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
      });
    }
  }, [user]);

  if (loading || !formData) return <div>Loading profile...</div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('user_profiles')
      .update(formData)
      .eq('id', user.id);

    setSaving(false);
    if (!error) setSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Musician Profile</h1>

      <ProfilePictureUpload />

      {/* BASIC INFO */}
      <section className="space-y-4">
        <h2 className="font-semibold">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" />
          <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" />
        </div>

        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
        <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" />

        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Short bio about you as a musician"
          rows={4}
        />
      </section>

      {/* MUSIC DETAILS */}
      <section className="space-y-4">
        <h2 className="font-semibold">Musician Details</h2>

        <select name="primary_role" value={formData.primary_role} onChange={handleChange}>
          <option value="">Select Role</option>
          <option value="Singer">Singer</option>
          <option value="Guitarist">Guitarist</option>
          <option value="Drummer">Drummer</option>
          <option value="DJ">DJ</option>
          <option value="Keyboardist">Keyboardist</option>
        </select>

        <input
          name="experience_years"
          type="number"
          value={formData.experience_years}
          onChange={handleChange}
          placeholder="Years of Experience"
        />

        <input
          name="hourly_rate"
          type="number"
          value={formData.hourly_rate}
          onChange={handleChange}
          placeholder="Hourly Rate (₦)"
        />

        <select name="availability" value={formData.availability} onChange={handleChange}>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Not Available</option>
        </select>
      </section>

      {/* EQUIPMENT */}
      <section className="space-y-4">
        <h2 className="font-semibold">Equipment</h2>
        <textarea
          name="gadget_specs"
          value={formData.gadget_specs}
          onChange={handleChange}
          placeholder="List your instruments, sound systems, etc."
          rows={3}
        />
      </section>

      {/* ONLINE PRESENCE */}
      <section className="space-y-4">
        <h2 className="font-semibold">Online Presence</h2>

        <input name="youtube" value={formData.youtube} onChange={handleChange} placeholder="YouTube link" />
        <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram link" />
        <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Twitter/X link" />
      </section>

      {/* ACTION */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {success && <p className="text-green-600">Profile updated successfully</p>}
    </div>
  );
}




//   //src/app/musician/profile/page.js

// 'use client';

// import ProfilePictureUpload from '@/components/ProfilePictureUpload';
// import { useAuth } from '@/context/AuthContext';
// import Layout from "@/components/Layout";

// // ... other imports ...

// export default function MusicianProfilePage() {
//   const { user } = useAuth();

//   if (!user) {
//     // Handle loading or redirect
//     return <div>Loading...</div>;
//   }

//   return (
//     <Layout>
//     <div>
//       <h1>{user.first_name}'s Profile</h1>
//       {user.profile_picture_url && (
//         <img src={user.profile_picture_url} alt="Profile" className="w-32 h-32 rounded-full" />
//       )}
//       <ProfilePictureUpload />
//       {/* ... rest of your profile form ... */}
//     </div>
//     </Layout>
//   );
// }