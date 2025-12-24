// src/components/MusicianCard.js - FULLY OPTIMIZED
"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSocial } from "@/context/SocialContext";
import { 
  MessageCircle, 
  MapPin, 
  Star, 
  Award, 
  Music, 
  CheckCircle,
  Clock
} from "lucide-react";
import { FaYoutube, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";

export default function MusicianCard({ musician }) {
  const {
    id,
    first_name,
    last_name,
    display_name,
    primary_role,
    is_available,
    bio,
    location,
    youtube,
    instagram,
    twitter,
    tiktok,
    profile_picture_url,
    gadget_specs,
    average_rating,
    hourly_rate,
    genres,
    experience_years,
    followers_count,
  } = musician;

  const router = useRouter();
  const { getOrCreateConversation } = useSocial();

  const displayName = display_name || `${first_name} ${last_name}`;

  const handleChat = async (e) => {
    e.stopPropagation();
    
    const { data, error } = await getOrCreateConversation(id);
    
    if (error) {
      console.error('Failed to create conversation:', error);
      return;
    }
    
    router.push('/messages');
  };

  const handleCardClick = () => {
    router.push(`/musician/${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
        {profile_picture_url ? (
          <Image
            src={profile_picture_url}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-16 h-16 text-purple-300 dark:text-purple-700" />
          </div>
        )}

        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            is_available 
              ? 'bg-green-500/90 text-white'
              : 'bg-gray-500/90 text-white'
          }`}>
            {is_available ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Available
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Busy
              </>
            )}
          </span>
        </div>

        {/* Top Rated Badge */}
        {average_rating >= 4.5 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/90 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
              <Award className="w-3 h-3" />
              Top Rated
            </span>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Name & Role */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {displayName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Music className="w-3.5 h-3.5" />
            {primary_role || 'Musician'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-sm">
          {/* Rating */}
          {average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {average_rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Experience */}
          {experience_years > 0 && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Award className="w-4 h-4" />
              <span>{experience_years}y</span>
            </div>
          )}

          {/* Followers */}
          {followers_count > 0 && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span className="font-semibold">{followers_count}</span>
              <span className="text-xs">followers</span>
            </div>
          )}
        </div>

        {/* Location & Rate */}
        <div className="flex items-center justify-between text-sm">
          {location && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
          
          {hourly_rate && (
            <div className="font-semibold text-purple-600 dark:text-purple-400">
              ₦{hourly_rate.toLocaleString()}/hr
            </div>
          )}
        </div>

        {/* Genres */}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.slice(0, 3).map((genre, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
              >
                {genre}
              </span>
            ))}
            {genres.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                +{genres.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Social Links */}
        {(youtube || instagram || twitter || tiktok) && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {youtube && (
              <a 
                href={youtube} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-red-600 hover:scale-110 transition-transform"
              >
                <FaYoutube size={18} />
              </a>
            )}
            {instagram && (
              <a 
                href={instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-pink-600 hover:scale-110 transition-transform"
              >
                <FaInstagram size={18} />
              </a>
            )}
            {twitter && (
              <a 
                href={twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sky-500 hover:scale-110 transition-transform"
              >
                <FaTwitter size={18} />
              </a>
            )}
            {tiktok && (
              <a 
                href={tiktok} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-900 dark:text-white hover:scale-110 transition-transform"
              >
                <FaTiktok size={18} />
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/musician/${id}`);
            }}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition"
          >
            View Profile
          </button>
          <button
            onClick={handleChat}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}

