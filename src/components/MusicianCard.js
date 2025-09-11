// src/components/MusicianCard.js
"use client";
import Link from "next/link";
import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";

export default function MusicianCard({ musician }) {
  const {
    id,
    name,
    role,
    available,
    bio,
    socials,
    youtube,
    profile_picture_url,
    gadget_specs,
    average_rating,
  } = musician;

  return (
    <Link href={`/musician/${id}`} className="block">
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex flex-col gap-4 transition hover:shadow-lg hover:scale-[1.02]">
        {/* Profile picture */}
        {profile_picture_url && (
          <img
            src={profile_picture_url}
            alt={`${name}'s profile`}
            className="w-full h-48 object-cover rounded-xl"
          />
        )}

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{role}</p>

          {/* Availability */}
          <p
            className={`mt-2 text-sm font-semibold ${
              available ? "text-green-500" : "text-red-500"
            }`}
          >
            {available ? "Available" : "Not Available"}
          </p>

          {/* Bio */}
          {bio && (
            <p className="mt-3 text-gray-700 dark:text-gray-400 text-sm">{bio}</p>
          )}

          {/* Gadgets */}
          {gadget_specs && (
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
              <span className="font-semibold">Gear:</span>{" "}
              {typeof gadget_specs === "string"
                ? gadget_specs
                : gadget_specs.map((g) => g.name).join(", ")}
            </p>
          )}
        </div>

        {/* Rating */}
        {average_rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                size={18}
                className={
                  i < average_rating
                    ? "text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }
              />
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              {average_rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Socials */}
        <div className="flex items-center gap-4 mt-2">
          {youtube && (
            <FaYoutube size={22} className="text-red-600 hover:scale-110 transition" />
          )}
          {socials?.instagram && (
            <FaInstagram size={22} className="text-pink-500 hover:scale-110 transition" />
          )}
          {socials?.twitter && (
            <FaTwitter size={22} className="text-sky-500 hover:scale-110 transition" />
          )}
        </div>
      </div>
    </Link>
  );
}
