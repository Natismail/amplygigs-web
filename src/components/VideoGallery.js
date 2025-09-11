// src/components/VideoGallery.js
"use client";
import { useState, useEffect } from "react";

export default function VideoGallery({ musicianId }) {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`/api/musician/media?musician_id=${musicianId}`);
        if (!res.ok) throw new Error("Failed to fetch videos");
        const data = await res.json();
        setVideos(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVideos();
  }, [musicianId]);

  const uploadVideo = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("musician_id", musicianId);

    try {
      const res = await fetch("/api/musician/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Video upload failed");

      const newVideo = await res.json();
      setVideos((prev) => [...prev, newVideo]);
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Performance Videos</h3>

      <div className="flex gap-2 items-center">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={uploadVideo}
          disabled={!file || loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Video"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((vid) => (
          <video key={vid.id} controls className="w-full rounded-lg shadow">
            <source src={vid.video_url} type="video/mp4" />
          </video>
        ))}
      </div>
    </div>
  );
}
