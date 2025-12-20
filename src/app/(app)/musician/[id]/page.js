"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
//import Layout from "@/components/Layout";
import ProposalForm from "@/components/ProposalForm";
import VideoGallery from "@/components/VideoGallery";
import RatingForm from "@/components/RatingForm";
import {
  FaYoutube,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";
import { FaStar } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";

export default function MusicianProfilePage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [musician, setMusician] = useState(null);
  const [videos, setVideos] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchMusician = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          id,
          name,
          display_name,
          bio,
          role,
          is_available,
          profile_picture_url,
          gadget_specs,
          average_rating,
          min_rate,
          youtube,
          tiktok,
          whatsapp,
          socials
        `)
        .eq("id", id)
        .eq("role", "MUSICIAN")
        .single();

      if (error) {
        console.error("Supabase profile error:", error);
        setMusician(null);
      } else {
        setMusician(data);
      }

      try {
        const res = await fetch(`/api/musician/media?musician_id=${id}`);
        if (res.ok) setVideos(await res.json());
      } catch (err) {
        console.error("Video fetch error:", err);
      }

      setLoading(false);
    };

    fetchMusician();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchRatings = async () => {
      try {
        const res = await fetch(`/api/ratings?musician_id=${id}`);
        const json = await res.json();
        if (json?.success) setRatings(json.data);
      } catch (err) {
        console.error("Ratings fetch error:", err);
      }
    };
    fetchRatings();
  }, [id]);

  const refreshRatings = async () => {
    const res = await fetch(`/api/ratings?musician_id=${id}`);
    const json = await res.json();
    if (json?.success) setRatings(json.data);

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
        <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
    );
  }

  if (!musician) {
    return (
        <p className="p-6 text-red-500">❌ Musician not found</p>
    );
  }

  const displayName = musician.display_name || musician.name;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-8 text-center">
          {/* <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-4"> */}
          <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden mb-4">
            {musician.profile_picture_url ? (
              <Image
                src={musician.profile_picture_url}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-3xl font-bold">
                {displayName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold">{displayName}</h1>

          <p
            className={`mt-2 font-semibold ${
              musician.is_available ? "text-green-500" : "text-red-500"
            }`}
          >
            {musician.is_available ? "Available for gigs" : "Not available"}
          </p>

          <p className="mt-2">⭐ {musician.average_rating?.toFixed(1) || "No ratings yet"}</p>

          {musician.min_rate && (
            <p className="text-sm text-gray-500">Starting from ₦{musician.min_rate}</p>
          )}
        </div>

        {/* BIO */}
        {musician.bio && (
          <section className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p>{musician.bio}</p>
          </section>
        )}

        {/* GADGETS */}
        {musician.gadget_specs && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Gadgets</h2>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {typeof musician.gadget_specs === "string"
                ? musician.gadget_specs
                : JSON.stringify(musician.gadget_specs, null, 2)}
            </pre>
          </section>
        )}

        {/* SOCIALS */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Connect</h2>
          <div className="flex gap-5 text-2xl">
            {musician.youtube && (
              <a href={musician.youtube} target="_blank">
                <FaYoutube />
              </a>
            )}
            {musician.socials?.instagram && (
              <a href={musician.socials.instagram} target="_blank">
                <FaInstagram />
              </a>
            )}
            {musician.socials?.twitter && (
              <a href={musician.socials.twitter} target="_blank">
                <FaTwitter />
              </a>
            )}
            {musician.tiktok && (
              <a href={musician.tiktok} target="_blank">
                <FaTiktok />
              </a>
            )}
            {musician.whatsapp && (
              <a href={`https://wa.me/${musician.whatsapp}`} target="_blank">
                <FaWhatsapp />
              </a>
            )}
          </div>
        </section>

        {/* VIDEOS */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Performance Videos</h2>
          <VideoGallery videos={videos} />
        </section>

        {/* RATINGS */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Ratings</h2>
          {user ? (
            <RatingForm musicianId={musician.id} onSuccess={refreshRatings} />
          ) : (
            <p className="text-gray-500">Login to rate</p>
          )}

          <div className="mt-6 space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="font-semibold text-yellow-500">⭐ {r.rating}</p>
                {r.comment && <p className="text-gray-700 dark:text-gray-300 mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">by {r.user_profiles?.name || "Anonymous"}</p>
              </div>
            ))}
            {ratings.length === 0 && <p className="text-gray-500">No ratings yet.</p>}
          </div>
        </section>

        {/* PROPOSALS */}
        {user && (
          <>
            <button
              onClick={() => setShowProposalForm(!showProposalForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {showProposalForm ? "Close Proposal" : "Send Proposal"}
            </button>

            {showProposalForm && <ProposalForm musicianId={musician.id} />}
          </>
        )}
      </div>
    </>
  );
}


