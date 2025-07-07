import { useState, useEffect } from 'react';
import { X, User, Clock, Info } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';

const Profiles = ({ friendId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authUser } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/friends/profile/${friendId}`);
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchProfile();
    }
  }, [friendId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Error</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Profile</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={profile.profilePic || "/avatar.png"}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={20} className="text-primary" />
              <div>
                <p className="font-semibold text-lg">{profile.fullName}</p>
                <p className="text-sm text-base-content/70">@{profile.username}</p>
              </div>
            </div>

            {/* About Section */}
            {profile.about && (
              <div className="flex items-start gap-3">
                <Info size={20} className="text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm text-base-content/70 mb-1">About</p>
                  <p className="text-sm">{profile.about}</p>
                </div>
              </div>
            )}

            {/* Last Seen */}
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-primary" />
              <div>
                <p className="font-medium text-sm text-base-content/70">Last seen</p>
                <p className="text-sm">
                  {profile.lastSeen ? formatMessageTime(profile.lastSeen) : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="btn btn-primary btn-wide"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profiles;
