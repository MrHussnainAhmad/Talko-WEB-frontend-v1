import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isCheckingAuth, isUpdatingProfile, updateProfile } =
    useAuthStore();
  const [selectedImage, setSelectedImage] = useState(null);

  // Function to compress image
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Compress the image first
      const compressedFile = await compressImage(file);

      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);

      reader.onload = async () => {
        const base64Image = reader.result;
        setSelectedImage(base64Image);

        // Send only the base64 part (without data:image/jpeg;base64,)
        await updateProfile({ profilePic: base64Image });
      };
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Profile Information</p>
          </div>

          {/* AVATAR or PROFILE PIC */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImage || authUser.profilePic || "/Profile.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-200"
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200 ${
                  isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                }`}
              >
                <Camera className="size-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to change profile picture"}
            </p>
          </div>

          {/* INFO-SECTION */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="size-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullname}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="size-4" />
                Email Address{" "}
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4"> Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since: </span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status:</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-base-content/60 font-medium tracking-wide">
        Created with ❤️ by{" "}
        <a
          href="https://github.com/MrHussnainAhmad/Talko-WEB-frontend-v1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary-focus transition-colors duration-200 font-semibold underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2"
        >
          Hussnain Ahmad.
        </a>
        &nbsp;Backend is powered on Vercel, and available on Github{" "}
        <a
          href="https://github.com/MrHussnainAhmad/Talko-Backend-v.3"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary-focus transition-colors duration-200 font-semibold underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2"
        >
          HERE
        </a>
      </p>
    </div>
  );
};

export default ProfilePage;
