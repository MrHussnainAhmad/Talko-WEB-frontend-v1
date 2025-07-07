import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const {
    authUser,
    isCheckingAuth,
    isUpdatingProfile,
    updateProfile,
    deleteAccount,
    logout,
  } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [about, setAbout] = useState(authUser?.about || "");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const navigate = useNavigate();

  // Sync about field when authUser changes
  React.useEffect(() => {
    setAbout(authUser?.about || "");
  }, [authUser?.about]);

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

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
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);

      reader.onload = async () => {
        const base64Image = reader.result;
        setSelectedImage(base64Image);
        await updateProfile({ profilePic: base64Image });
      };
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to update profile picture");
    }
  };

  const handleAboutUpdate = async () => {
    if (about.trim() === (authUser?.about || "").trim()) {
      setIsEditingAbout(false);
      return;
    }

    try {
      await updateProfile({ about: about.trim() });
      setIsEditingAbout(false);
      toast.success("About updated successfully!");
    } catch (error) {
      console.error("Error updating about:", error);
      toast.error("Failed to update about");
      setAbout(authUser?.about || ""); // Reset to original value
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      toast.error("Please enter your password to confirm account deletion");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(password);
      setIsDeleteModalOpen(false);
      toast.success("Account deleted successfully");
      navigate("/login");
    } catch (error) {
      console.error("Account deletion failed:", error);
      toast.error(
        error.message || "Account deletion failed. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Manage your account information</p>
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
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="size-4" />
                About
              </div>
              {isEditingAbout ? (
                <div className="space-y-2">
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows="3"
                    maxLength="200"
                    placeholder="Tell us about yourself..."
                    disabled={isUpdatingProfile}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {about.length}/200 characters
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAbout(authUser?.about || "");
                          setIsEditingAbout(false);
                        }}
                        className="px-3 py-1 text-sm bg-base-300 hover:bg-base-200 rounded-md transition-colors"
                        disabled={isUpdatingProfile}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAboutUpdate}
                        className={`px-3 py-1 text-sm bg-primary hover:bg-primary-focus text-white rounded-md transition-colors ${
                          isUpdatingProfile ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingAbout(true)}
                  className="px-4 py-2.5 bg-base-200 rounded-lg border min-h-[2.5rem] cursor-pointer hover:bg-base-300 transition-colors flex items-center"
                >
                  <p className="text-base-content">
                    {authUser?.about || "Click to add something about yourself..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since:</span>
                <span>{authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Date not available'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-red-700 py-4">
                <span>Account Status:</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>

          {/* Delete Account Button */}
          <div className="mt-8 ">
            {/* First Row: span and button */}
            <div className="flex justify-around items-center">
              <span className="text-red-500">Account Deletion</span>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <Trash2 className="size-5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-500 mb-4">
              Delete Account
            </h2>
            <p className="mb-4 text-base-content">
              This action will permanently delete your account and all
              associated data. This cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block mb-2 text-base-content">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-base-100 text-base-content"
                placeholder="Your password"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-base-300 text-base-content"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
                  isDeleting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-base-content/60 font-medium tracking-wide mt-8">
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
