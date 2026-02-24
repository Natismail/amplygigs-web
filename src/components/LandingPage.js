"use client";

import { useState } from 'react';
import Logo from './Logo'; // ⭐ NEW
import { 
  Music, 
  Users, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  Play,
  Star,
  Shield,
  TrendingUp,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    {
      icon: Music,
      title: 'Find Top Musicians',
      description: 'Browse verified musicians across all genres. From Afrobeat to Jazz, find the perfect sound for your event.',
    },
    {
      icon: Calendar,
      title: 'Book Instantly',
      description: 'Seamless booking system with real-time availability. Lock in your artist in minutes, not days.',
    },
    {
      icon: Sparkles,
      title: 'Amy AI Assistant',
      description: 'Your personal AI assistant. Find musicians, get recommendations, and manage bookings with voice commands.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Protected transactions with Paystack and Stripe. Your money is safe until the event is complete.',
    },
    {
      icon: Users,
      title: 'Build Your Profile',
      description: 'Musicians: Showcase your talent, set your rates, and get discovered by thousands of event organizers.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Gigs',
      description: 'Analytics, reviews, and promotion tools to help musicians build their brand and increase bookings.',
    },
  ];

  const testimonials = [
    {
      name: 'Chidi Okonkwo',
      role: 'Wedding Planner',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chidi',
      text: 'AmplyGigs made finding a live band for my client\'s wedding so easy. Booked in under 10 minutes!',
      rating: 5,
    },
    {
      name: 'Femi Adebayo',
      role: 'Jazz Saxophonist',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Femi',
      text: 'I\'ve tripled my monthly bookings since joining. The platform is a game-changer for musicians.',
      rating: 5,
    },
    {
      name: 'Amara Nwosu',
      role: 'Corporate Event Manager',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara',
      text: 'The AI assistant Amy helped me find the perfect DJ for our company retreat. Super impressed!',
      rating: 5,
    },
  ];

  const stats = [
    { label: 'Active Musicians', value: '2,500+' },
    { label: 'Events Booked', value: '10,000+' },
    { label: 'Cities Covered', value: '50+' },
    { label: 'Customer Satisfaction', value: '4.9/5' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
                        <Logo size="lg" showText={true} href="/" />

            <div className="flex items-center gap-2">
              {/* <Music className="w-8 h-8 text-purple-600" /> */}
              
              {/* <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AmplyGigs
              </span> */}
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 transition">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition">Testimonials</a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('/login')}
              //onClick={() => onNavigate('/auth/login')}
                className="px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('/signup')}
                //onClick={() => onNavigate('/auth/signup')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Powered by AI
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Book Live Music for{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Any Event
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Connect with Nigeria's top musicians and DJs. From weddings to corporate events, 
                find the perfect sound with our AI-powered platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => onNavigate('/signup')}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Start Booking Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                
                <button
                  onClick={() => onNavigate('/explore')}
                  className="px-8 py-4 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Browse Musicians
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Image/Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop"
                  alt="Live music performance"
                  className="w-full h-80 object-cover rounded-2xl mb-6"
                />
                
                {/* Amy Badge */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Meet Amy, Your AI Assistant
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      "Hi! I can help you find the perfect musician for your event."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Powerful features to make booking live music effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Book your perfect musician in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Browse & Search',
                description: 'Use our AI assistant Amy or browse musicians by genre, location, and budget.',
              },
              {
                step: '2',
                title: 'Review & Book',
                description: 'Check profiles, reviews, and availability. Book instantly with secure payment.',
              },
              {
                step: '3',
                title: 'Enjoy Your Event',
                description: 'Relax! Your musician will show up prepared. Rate your experience after the event.',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 -z-10"></div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Musicians & Clients
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what our community is saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs & Auditions Section - NEW */}
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      
      {/* Left: Content */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            New Feature
          </span>
        </div>

        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Find Long-Term Music Jobs
        </h2>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Beyond one-time gigs, discover permanent positions, church music director roles, 
          venue resident artists, and band member auditions.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Permanent Positions
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Monthly salaries, benefits, and stable income
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Audition Management
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Schedule auditions, rate candidates, hire with confidence
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Churches & Venues
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Perfect for worship teams, hotels, restaurants, and event companies
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/jobs')}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105"
        >
          Browse Job Openings
        </button>
      </div>

      {/* Right: Stats/Visual */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
          <div className="text-gray-700 dark:text-gray-300 font-medium">Active Job Openings</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="text-4xl font-bold text-blue-600 mb-2">₦150K</div>
          <div className="text-gray-700 dark:text-gray-300 font-medium">Average Monthly Salary</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
          <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
          <div className="text-gray-700 dark:text-gray-300 font-medium">Musicians Hired</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl p-6 border border-pink-200 dark:border-pink-700">
          <div className="text-4xl font-bold text-pink-600 mb-2">30</div>
          <div className="text-gray-700 dark:text-gray-300 font-medium">Days Listing Duration</div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Musician?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of event organizers and musicians on AmplyGigs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('/signup')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button
              onClick={() => onNavigate('/explore')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition"
            >
              Explore AmplyGigs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto text-center">
    <div className="flex items-center justify-center gap-2 mb-4">
      {/* <Music className="w-6 h-6 text-purple-400" />
      <span className="text-xl font-bold text-white">AmplyGigs</span> */}
         <Logo size="lg" showText={true}/>

    </div>
    <p className="text-sm mb-4">
      © 2026 AmplyGigs. All rights reserved.
    </p>
    <div className="flex justify-center gap-6 text-sm">
      <button onClick={() => onNavigate('/privacy')} className="hover:text-purple-400 transition">Privacy Policy</button>
      <button onClick={() => onNavigate('/terms')} className="hover:text-purple-400 transition">Terms of Service</button>
      <button onClick={() => onNavigate('/contact')} className="hover:text-purple-400 transition">Contact Us</button>
    </div>
  </div>
</footer>
    </div>
  );
}