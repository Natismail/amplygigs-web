// src/app/update-profile/page.js
import UpdateProfileForm from "@/components/UpdateProfileForm";

export default function UpdateProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Update Profile</h1>
      <UpdateProfileForm />
    </div>
  );
}
