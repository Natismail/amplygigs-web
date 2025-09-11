// src/hooks/useMusicianProfile.js
"use client";
import { useState } from "react";

export function useMusicianProfile() {
  const [updating, setUpdating] = useState(false);

  const updateProfilePicture = async (musician_id, url) => {
    try {
      setUpdating(true);
      const res = await fetch("/api/musicians/updateProfilePicture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musician_id, profile_picture_url: url }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error("updateProfilePicture error:", err);
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return { updateProfilePicture, updating };
}
