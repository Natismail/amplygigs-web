//app/(app)/partners/apply/page.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Music,
  CheckCircle,
  Upload,
  ArrowRight,
} from "lucide-react";

export default function PartnerApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Choose type, 2: Fill form, 3: Success
  const [partnerType, setPartnerType] = useState(""); // venue, event_manager, record_label, promoter
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Common fields
    company_name: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    website_url: "",
    
    // Venue specific
    venue_address: "",
    venue_city: "Lagos",
    venue_capacity: "",
    venue_type: "",
    
    // Event Manager/Label specific
    company_type: "",
    years_in_business: "",
    number_of_artists: "",
    
    // Documents
    business_registration_number: "",
    tax_id: "",
    
    // Additional info
    description: "",
    social_media: {
      instagram: "",
      twitter: "",
      facebook: "",
    },
  });

  const partnerTypes = [
    {
      id: "venue",
      icon: Building2,
      title: "Venue Partner",
      description: "Own or manage a venue? Host events and earn from bookings",
      benefits: [
        "Featured venue listings",
        "Direct artist bookings",
        "Event management tools",
        "Revenue from hosted events",
      ],
    },
    {
      id: "event_manager",
      icon: Music,
      title: "Event Manager",
      description: "Manage events and artists professionally on our platform",
      benefits: [
        "Manage multiple artists",
        "Event creation tools",
        "Commission tracking",
        "Analytics dashboard",
      ],
    },
    {
      id: "record_label",
      icon: Music,
      title: "Record Label",
      description: "Manage your label's artists and promote their live shows",
      benefits: [
        "Artist roster management",
        "Promotional tools",
        "Revenue sharing",
        "Brand presence",
      ],
    },
    {
      id: "promoter",
      icon: Music,
      title: "Promoter",
      description: "Promote events and connect artists with opportunities",
      benefits: [
        "Event promotion tools",
        "Artist network access",
        "Commission structure",
        "Marketing support",
      ],
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_type: partnerType,
          application_data: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(3);
      } else {
        alert("Failed to submit application: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Choose Partner Type
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Become an AmplyGigs Partner
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Join our network and grow your business with live music
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  setPartnerType(type.id);
                  setStep(2);
                }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-purple-500 dark:hover:border-purple-500 transition cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition">
                    <type.icon className="w-6 h-6 text-purple-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {type.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {type.description}
                </p>

                <ul className="space-y-2 mb-4">
                  {type.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Application Form
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
              ← Back to selection
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Partner Application
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {
                partnerTypes.find((t) => t.id === partnerType)
                  ?.title
              }{" "}
              Application
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Company Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.business_registration_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_registration_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID / TIN
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_id: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({ ...formData, website_url: e.target.value })
                      }
                      placeholder="https://"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      About Your {partnerType === "venue" ? "Venue" : "Company"}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </section>

              {/* Venue Specific Fields */}
              {partnerType === "venue" && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Venue Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Address *
                      </label>
                      <input
                        type="text"
                        value={formData.venue_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            venue_address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.venue_city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              venue_city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={formData.venue_capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              venue_capacity: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Type
                      </label>
                      <select
                        value={formData.venue_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            venue_type: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select type</option>
                        <option value="club">Club/Lounge</option>
                        <option value="concert_hall">Concert Hall</option>
                        <option value="outdoor">Outdoor Venue</option>
                        <option value="restaurant">Restaurant/Bar</option>
                        <option value="arena">Arena/Stadium</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* Event Manager/Label Specific Fields */}
              {(partnerType === "event_manager" ||
                partnerType === "record_label") && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Business Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Years in Business
                      </label>
                      <input
                        type="number"
                        value={formData.years_in_business}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            years_in_business: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of Artists Managed
                      </label>
                      <input
                        type="number"
                        value={formData.number_of_artists}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            number_of_artists: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Contact Information */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Primary Contact
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primary_contact_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.primary_contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primary_contact_email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.primary_contact_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primary_contact_phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Social Media */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Social Media (Optional)
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.social_media.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_media: {
                            ...formData.social_media,
                            instagram: e.target.value,
                          },
                        })
                      }
                      placeholder="@username"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.social_media.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_media: {
                            ...formData.social_media,
                            twitter: e.target.value,
                          },
                        })
                      }
                      placeholder="@username"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={formData.social_media.facebook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_media: {
                            ...formData.social_media,
                            facebook: e.target.value,
                          },
                        })
                      }
                      placeholder="Page name or URL"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Submitted!
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for applying to become an AmplyGigs partner. We'll review
            your application and get back to you within 2-3 business days.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What's Next?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 text-left space-y-1">
              <li>• Our team will review your application</li>
              <li>• We may contact you for additional information</li>
              <li>• You'll receive an email with our decision</li>
              <li>• If approved, we'll send onboarding instructions</li>
            </ul>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}