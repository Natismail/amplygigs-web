// src/components/UploadWidget.js
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UploadWidget({ bucket, folder, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file) return;

      const filePath = `${folder}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, file);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onUpload(data.publicUrl); // send back the public URL
    } catch (err) {
      console.error("Upload error:", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
      />
      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
    </div>
  );
}
