// src/components/LandingPage.jsx
// Changes:
//   • Footer Privacy/Terms use <Link> (not onNavigate) — Google OAuth crawler needs real hrefs
//   • Full mobile responsiveness pass: nav, hero, stats, features, how-it-works, testimonials, jobs, CTA, footer
//   • Hero buttons stack on mobile, side-by-side on sm+
//   • Stats grid 2-col on mobile, 4-col on sm+
//   • Features 1-col mobile → 2-col md → 3-col lg
//   • How It Works: step connector lines hidden on mobile
//   • Testimonials: 1-col mobile → 3-col md
//   • Jobs section: stacked on mobile, side-by-side on lg
//   • All existing functionality (onNavigate, features, stats, testimonials) unchanged

"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import {
  Music, Users, Calendar, Sparkles, ArrowRight, Play,
  Star, Shield, TrendingUp, Briefcase, CheckCircle,
} from "lucide-react";

export default function LandingPage({ onNavigate }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    { icon: Music,     title: "Find Top Musicians",   description: "Browse verified musicians across all genres. From Afrobeat to Jazz, find the perfect sound for your event." },
    { icon: Calendar,  title: "Book Instantly",        description: "Seamless booking system with real-time availability. Lock in your artist in minutes, not days." },
    { icon: Sparkles,  title: "Amy AI Assistant",      description: "Your personal AI assistant. Find musicians, get recommendations, and manage bookings with voice commands." },
    { icon: Shield,    title: "Secure Payments",       description: "Protected transactions with Paystack and Stripe. Your money is safe until the event is complete." },
    { icon: Users,     title: "Build Your Profile",    description: "Musicians: Showcase your talent, set your rates, and get discovered by thousands of event organizers." },
    { icon: TrendingUp,title: "Grow Your Gigs",        description: "Analytics, reviews, and promotion tools to help musicians build their brand and increase bookings." },
  ];

  const testimonials = [
    { name: "Chidi Okonkwo",  role: "Wedding Planner",          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chidi",  text: "AmplyGigs made finding a live band for my client's wedding so easy. Booked in under 10 minutes!", rating: 5 },
    { name: "Femi Adebayo",   role: "Jazz Saxophonist",          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Femi",   text: "I've tripled my monthly bookings since joining. The platform is a game-changer for musicians.", rating: 5 },
    { name: "Amara Nwosu",    role: "Corporate Event Manager",   image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amara",  text: "The AI assistant Amy helped me find the perfect DJ for our company retreat. Super impressed!", rating: 5 },
  ];

  const stats = [
    { label: "Active Musicians",       value: "2,500+" },
    { label: "Events Booked",          value: "10,000+" },
    { label: "Cities Covered",         value: "50+" },
    { label: "Customer Satisfaction",  value: "4.9/5" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="lg" showText href="/" />

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features"      className="text-gray-600 hover:text-purple-600 transition text-sm">Features</a>
              <a href="#how-it-works"  className="text-gray-600 hover:text-purple-600 transition text-sm">How It Works</a>
              <a href="#testimonials"  className="text-gray-600 hover:text-purple-600 transition text-sm">Testimonials</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => onNavigate("/login")}
                className="px-3 sm:px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("/signup")}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition hover:scale-105 text-sm font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Powered by AI</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-5 leading-tight">
                Book Live Music for{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Any Event
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-7 leading-relaxed">
                Connect with Nigeria's top musicians and DJs. From weddings to corporate events,
                find the perfect sound with our AI-powered platform.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => onNavigate("/signup")}
                  className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl transition hover:scale-105 flex items-center justify-center gap-2"
                >
                  Start Booking Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => onNavigate("/explore")}
                  className="w-full sm:w-auto px-8 py-4 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Browse Talents
                </button>
              </div>

              {/* Stats — 2 col on mobile, 4 col on sm+ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right card — hidden on small mobile, shown md+ */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop"
                  alt="Live music performance"
                  className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6"
                />
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Meet Amy, Your AI Assistant</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">"Hi! I can help you find the perfect musician for your event."</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">Powerful features to make booking live music effortless</p>
          </div>

          {/* 1-col mobile → 2-col md → 3-col lg */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-6 relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-white 
dark:bg-blue-950/30 dark:hover:bg-blue-950/15 dark:border-blue-800/30 dark:hover:border-blue-400/40 dark:hover:shadow-xl dark:hover:shadow-blue-900/30 dark:hover:backdrop-blur-md">
                           <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                 
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">Book your perfect musician in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", title: "Browse & Search",  description: "Use our AI assistant Amy or browse musicians by genre, location, and budget." },
              { step: "2", title: "Review & Book",    description: "Check profiles, reviews, and availability. Book instantly with secure payment." },
              { step: "3", title: "Enjoy Your Event", description: "Relax! Your musician will show up prepared. Rate your experience after the event." },
            ].map((s, idx) => (
              <div key={idx} className="relative">
                {/* Connector — desktop only */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 -z-10" />
                )}
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 
dark:bg-purple-950/30 dark:hover:bg-pink-950/20 dark:border-purple-800/30 dark:hover:border-pink-400/45 dark:hover:shadow-2xl dark:hover:shadow-pink-900/30 dark:hover:backdrop-blur-lg                 transition-all duration-300">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white mb-5 mx-auto">
                    {s.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">{s.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by Musicians & Clients</h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">See what our community is saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/50 dark:hover:bg-gray-800/20 dark:hover:border-purple-500/30 dark:hover:shadow-lg dark:hover:shadow-purple-900/20 dark:hover:backdrop-blur-md transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic text-sm sm:text-base">"{t.text}"</p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <img src={t.image} alt={t.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jobs Section ────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">New Feature</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-5">
                Find Long-Term Music Jobs
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-7">
                Beyond one-time gigs, discover permanent positions, church music director roles,
                venue resident artists, and band member auditions.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: "Permanent Positions",    desc: "Monthly salaries, benefits, and stable income" },
                  { title: "Audition Management",    desc: "Schedule auditions, rate candidates, hire with confidence" },
                  { title: "Churches & Venues",      desc: "Perfect for worship teams, hotels, restaurants, and event companies" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-0.5">{item.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate("/jobs")}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition hover:scale-105"
              >
                Browse Job Openings
              </button>
            </div>

            {/* Right stats grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { value: "50+",    label: "Active Job Openings",  from: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20", border: "border-purple-200 dark:border-purple-700", color: "text-purple-600" },
                { value: "₦150K", label: "Avg Monthly Salary",   from: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",       border: "border-blue-200 dark:border-blue-700",   color: "text-blue-600" },
                { value: "200+",   label: "Musicians Hired",      from: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",   border: "border-green-200 dark:border-green-700", color: "text-green-600" },
                { value: "30",     label: "Days Listing Duration", from: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20",      border: "border-pink-200 dark:border-pink-700",   color: "text-pink-600" },
              ].map((item) => (
                <div key={item.label} className={`bg-gradient-to-br ${item.from} rounded-2xl p-5 sm:p-6 border ${item.border} dark:hover:opacity-80 dark:hover:backdrop-blur-md dark:hover:shadow-lg transition-all duration-300`}>
                  <div className={`text-3xl sm:text-4xl font-bold ${item.color} mb-1`}>{item.value}</div>
                  <div className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Ready to Find Your Perfect Musician?
          </h2>
          <p className="text-lg sm:text-xl text-purple-100 mb-8">
            Join thousands of event organizers and musicians on AmplyGigs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate("/signup")}
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transition hover:scale-105"
            >
              Get Started Free
            </button>
            <button
              onClick={() => onNavigate("/explore")}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition"
            >
              Explore AmplyGigs
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-300 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Logo size="lg" showText />
            <p className="text-sm text-gray-400 text-center">
              Connecting Skills to Platforms
            </p>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-gray-500">© 2026 AmplyGigs. All rights reserved.</p>

            {/*
              ✅ CRITICAL: Use <Link> (not onNavigate) for Privacy and Terms.
              Google OAuth verification crawls these URLs directly — they must be
              real href links, not JS-only click handlers with a splash delay.
            */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/privacy" className="hover:text-purple-400 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-purple-400 transition">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-purple-400 transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}