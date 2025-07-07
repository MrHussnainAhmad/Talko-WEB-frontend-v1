import React, { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { X, User, Calendar, FileText } from "lucide-react";
import toast from "react-hot-toast";

const UserProfile = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get(`/auth/user-profile/${userId}`);
        // The API returns {user: {...}}, so we need to extract the user object
        setProfile(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-base-content">User Profile</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
            aria-label="Close profile"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-error mb-4">Failed to load profile</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                // Retry fetch
                const fetchUserProfile = async () => {
                  try {
                    const response = await axiosInstance.get(`/auth/user-profile/${userId}`);
                    setProfile(response.data.user);
                  } catch (err) {
                    setError(err.response?.data?.message || err.message);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchUserProfile();
              }}
              className="btn btn-primary btn-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            {/* Profile Picture and Name */}
            <div className="flex flex-col items-center gap-4">
              <div className="avatar">
                <div className="size-24 rounded-full">
                  <img
                    src={profile.profilePic || "/Profile.png"}
                    alt={profile.fullname || 'User'}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-base-content">
                  {profile.fullname}
                </h3>
                <p className="text-base-content/70">@{profile.username}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              {/* About Section */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <FileText className="size-4" />
                  About
                </div>
                <div className="px-4 py-2.5 bg-base-300 rounded-lg border">
                  <p className="text-base-content">
                    {profile.about || "No information provided."}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Calendar className="size-4" />
                  Member Since
                </div>
                <div className="px-4 py-2.5 bg-base-300 rounded-lg border">
                  <p className="text-base-content">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Date not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

