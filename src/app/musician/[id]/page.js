"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import ProposalForm from "@/components/ProposalForm";
import VideoGallery from "@/components/VideoGallery";
import RatingForm from "@/components/RatingForm";
import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

export default function MusicianProfilePage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [musician, setMusician] = useState(null);
  const [videos, setVideos] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);

  // Fetch profile + videos
  useEffect(() => {
    async function fetchMusician() {
      if (!id) return;
      setLoading(true);

      // fetch main profile
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "id, name, role, bio, available, profile_picture_url, gadget_specs, average_rating, youtube, socials"
        )
        .eq("id", id)
        .eq("role", "MUSICIAN")
        .single();

      if (error || !data) {
        console.error("Error fetching musician:", error?.message);
        setMusician(null);
      } else {
        setMusician(data);
      }

      // fetch videos
      try {
        const res = await fetch(`/api/musician/media?musician_id=${id}`);
        if (res.ok) {
          const media = await res.json();
          setVideos(media);
        }
      } catch (err) {
        console.error("Error fetching videos:", err.message);
      }

      setLoading(false);
    }

    fetchMusician();
  }, [id]);

  // Fetch ratings
  useEffect(() => {
    if (!id) return;
    const fetchRatings = async () => {
      try {
        const res = await fetch(`/api/ratings?musician_id=${id}`);
        const json = await res.json();
        if (json.success) {
          setRatings(json.data);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err.message);
      }
    };
    fetchRatings();
  }, [id]);

  // Handler after submitting a rating
  const handleRatingSubmit = async () => {
    const res = await fetch(`/api/ratings?musician_id=${id}`);
    const json = await res.json();
    if (json.success) setRatings(json.data);

    // also refresh musician average
    const { data } = await supabase
      .from("user_profiles")
      .select("average_rating")
      .eq("id", id)
      .single();
    if (data) {
      setMusician((prev) => ({ ...prev, average_rating: data.average_rating }));
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!musician) {
    return (
      <Layout>
        <p className="p-6 text-red-500">❌ Musician not found</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* --- Profile Header --- */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-8 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden shadow-md mb-4">
            {musician.profile_picture_url ? (
              <img
                src={musician.profile_picture_url}
                alt={musician.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl font-bold text-white">
                {musician.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {musician.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Musician</p>
          <p
            className={`mt-2 text-sm font-semibold ${
              musician.available ? "text-green-500" : "text-red-500"
            }`}
          >
            {musician.available ? "✅ Available" : "❌ Not Available"}
          </p>

          {/* Average Rating */}
          <p className="mt-2 font-medium">
            ⭐ {musician.average_rating?.toFixed(1) || "No ratings yet"}
          </p>
        </div>

        {/* --- Bio --- */}
        {musician.bio && (
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {musician.bio}
            </p>
          </div>
        )}

        {/* --- Gadgets --- */}
        {musician.gadget_specs && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Gadget Specs</h2>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {typeof musician.gadget_specs === "string"
                ? musician.gadget_specs
                : JSON.stringify(musician.gadget_specs, null, 2)}
            </pre>
          </div>
        )}

        {/* --- Socials --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Socials</h2>
          <div className="flex gap-6 text-2xl justify-center sm:justify-start">
            {musician.youtube && (
              <a
                href={musician.youtube}
                target="_blank"
                rel="noreferrer"
                className="text-red-600 hover:scale-110 transition-transform"
              >
                <FaYoutube />
              </a>
            )}
            {musician.socials?.instagram && (
              <a
                href={musician.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-pink-500 hover:scale-110 transition-transform"
              >
                <FaInstagram />
              </a>
            )}
            {musician.socials?.twitter && (
              <a
                href={musician.socials.twitter}
                target="_blank"
                rel="noreferrer"
                className="text-sky-500 hover:scale-110 transition-transform"
              >
                <FaTwitter />
              </a>
            )}
          </div>
        </div>

        {/* --- Videos --- */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance Videos</h2>
          <VideoGallery videos={videos} />
        </div>

        {/* --- Rating --- */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ratings</h2>
          {user ? (
            <RatingForm musicianId={musician.id} onSuccess={handleRatingSubmit} />
          ) : (
            <p className="text-gray-500">Please log in to leave a rating.</p>
          )}

          {/* Ratings list */}
          <div className="mt-6 space-y-4">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <p className="font-semibold text-yellow-500">⭐ {r.rating}</p>
                {r.comment && (
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {r.comment}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  by {r.user_profiles?.name || "Anonymous"}
                </p>
              </div>
            ))}
            {ratings.length === 0 && (
              <p className="text-gray-500">No ratings yet.</p>
            )}
          </div>
        </div>

        {/* --- Proposals --- */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowProposalForm((prev) => !prev)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showProposalForm ? "Close Proposal Form" : "Send a Proposal"}
          </button>
        </div>

        {showProposalForm && user && (
          <ProposalForm musicianId={musician.id} />
        )}
      </div>
    </Layout>
  );
}
