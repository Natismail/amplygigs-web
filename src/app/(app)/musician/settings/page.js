"use client";

import Link from "next/link";
import {
  User,
  Paintbrush,
  Shield,
  Bell,
  CreditCard,
} from "lucide-react";

const settings = [
  {
    title: "Profile",
    description: "Update your profile, media & public info",
    href: "/musician/settings/profile",
    icon: User,
  },
  {
    title: "Customization",
    description: "Customize your public musician page",
    href: "/musician/settings/customization",
    icon: Paintbrush,
  },
  {
    title: "Security",
    description: "Password, sessions & account safety",
    href: "/musician/settings/security",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Email & app notifications",
    href: "/musician/settings/notifications",
    icon: Bell,
  },
  {
    title: "Bank Accounts",
    description: "Manage payout bank accounts",
    href: "/musician/settings/bank-accounts",
    icon: CreditCard,
  },
];

export default function MusicianSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow transition"
            >
              <div className="flex items-start gap-4">
                <Icon className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
