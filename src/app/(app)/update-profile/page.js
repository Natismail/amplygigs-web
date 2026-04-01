// src/app/update-profile/page.js
import UpdateProfileForm from "@/components/UpdateProfileForm";

export default function UpdateProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl position-sticky font-bold mb-1 dark:text-white">Update Profile</h1>
      <UpdateProfileForm />
    </div>
  );
}
