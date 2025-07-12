import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  X,
  Circle,
  UserCheck,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import UserProfile from "./UserProfile";
import BlockConfirmModal from "./BlockConfirmModal";
import { getFormattedLastSeen } from "../lib/utils";

const ChatHeader = () => {
  const {
    selectedUser,
    setSelectedUser,
    messageCounts,
    deleteChatHistory,
    typingUsers,
  } = useChatStore();
  const {
    onlineUsers,
    removeFriend,
    blockUser,
    unblockUser,
    getLastSeen,
    checkBlockStatus,
    isBlockingUser,
  } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [lastSeenInfo, setLastSeenInfo] = useState(null);
  const [blockStatus, setBlockStatus] = useState({
    isBlocked: false,
    isBlockedBy: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isOnline = onlineUsers.includes(selectedUser?._id);
  const messageCount = messageCounts[selectedUser?._id] || 0;
  const isTyping = typingUsers.includes(selectedUser?._id);

  // Fetch last seen and block status when user changes
  useEffect(() => {
    if (selectedUser?._id) {
      fetchLastSeenAndBlockStatus();
    }
  }, [selectedUser?._id]);

  // Update last seen info when online status changes
  useEffect(() => {
    if (selectedUser?._id && !isOnline) {
      fetchLastSeen();
    }
  }, [isOnline, selectedUser?._id]);

  // Update current time and last seen every minute for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // Only fetch last seen if user is offline and not blocked
      if (selectedUser?._id && !isOnline && !blockStatus.isBlockedBy) {
        fetchLastSeen();
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedUser?._id, isOnline, blockStatus.isBlockedBy]);

  // Handle click outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const fetchLastSeenAndBlockStatus = async () => {
    if (!selectedUser?._id) return;

    // Fetch both last seen and block status
    const [lastSeenRes, blockStatusRes] = await Promise.all([
      getLastSeen(selectedUser._id),
      checkBlockStatus(selectedUser._id),
    ]);

    if (lastSeenRes) {
      setLastSeenInfo(lastSeenRes);
    }

    if (blockStatusRes) {
      setBlockStatus(blockStatusRes);
    }
  };

  const fetchLastSeen = async () => {
    if (!selectedUser?._id) return;

    const lastSeenRes = await getLastSeen(selectedUser._id);
    if (lastSeenRes) {
      setLastSeenInfo(lastSeenRes);
    }
  };

  const handleRemoveFriend = async () => {
    if (
      window.confirm(
        `Are you sure you want to remove ${selectedUser?.fullname} as a friend?`
      )
    ) {
      await removeFriend(selectedUser?._id);
      setSelectedUser(null);
    }
  };

  const handleDeleteChatHistory = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete your chat history with ${selectedUser?.fullname}? This will delete the history for both users.`
      )
    ) {
      await deleteChatHistory(selectedUser?._id);
    }
  };

  const handleBlockToggle = () => {
    if (!selectedUser?._id) return;
    setShowBlockModal(true);
  };

  const handleBlockConfirm = async () => {
    if (!selectedUser?._id) return;

    const isCurrentlyBlocked = blockStatus.isBlocked;
    const result = isCurrentlyBlocked
      ? await unblockUser(selectedUser._id)
      : await blockUser(selectedUser._id);

    if (result.success) {
      // Update block status
      setBlockStatus((prev) => ({
        ...prev,
        isBlocked: !isCurrentlyBlocked,
      }));

      setShowBlockModal(false);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR / PROFILE-PIC with Online Indicator */}
          <div className="avatar">
            <div
              className={`size-10 rounded-full relative ${
                blockStatus.isBlockedBy
                  ? "cursor-default"
                  : "cursor-pointer hover:opacity-80"
              } transition-opacity`}
              onClick={() => !blockStatus.isBlockedBy && setShowProfile(true)}
              title={
                blockStatus.isBlockedBy
                  ? "Profile not available"
                  : `View ${selectedUser?.fullname}'s profile`
              }
            >
              <img
                src={
                  blockStatus.isBlockedBy
                    ? "/Profile.png"
                    : selectedUser?.profilePic || "/Profile.png"
                }
                alt={selectedUser?.fullname || "User"}
                className="rounded-full object-cover"
              />
              {/* Online Status Indicator - hidden when either party blocks the other */}
              {!blockStatus.isBlockedBy && !blockStatus.isBlocked && (
                <div
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-base-100 ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
              )}
            </div>
          </div>

          {/* USER INFO */}
          <div className="flex-1 min-w-0 pr-2">
            {/* Stack layout on small screens to prevent horizontal overflow */}
            <div className="max-[840px]:space-y-1">
              {/* Name row - always on its own line on small screens */}
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base-content max-[840px]:text-sm">
                  {selectedUser?.fullname}
                </h3>
                {/* Friend Indicator */}
                <UserCheck className="size-4 max-[840px]:size-3 text-green-600 flex-shrink-0" title="Friend" />
              </div>

              {/* Info row - stacked on small screens */}
              <div className="max-[840px]:flex max-[840px]:flex-col max-[840px]:gap-1 min-[841px]:flex min-[841px]:items-center min-[841px]:gap-2">
                {/* Username */}
                <div className="flex items-center gap-2 max-[840px]:gap-1">
                  <p className="text-sm max-[840px]:text-xs text-base-content/70">
                    @{selectedUser?.username}
                  </p>
                </div>

                {/* Status and message count - single line on small screens */}
                <div className="flex items-center gap-2 max-[840px]:gap-1">
                  <div className="flex items-center gap-1 max-[840px]:gap-0.5">
                    <Circle
                      className={`size-2 max-[840px]:size-1.5 fill-current flex-shrink-0 ${
                        isTyping
                          ? "text-blue-500"
                          : isOnline
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm max-[840px]:text-xs font-medium ${
                        isTyping
                          ? "text-blue-600"
                          : isOnline
                          ? "text-green-600"
                          : "text-base-content/70"
                      }`}
                    >
                      {blockStatus.isBlocked || blockStatus.isBlockedBy
                        ? "Last seen"
                        : isTyping
                        ? "typing..."
                        : isOnline
                        ? "Online"
                        : lastSeenInfo?.lastSeen
                        ? getFormattedLastSeen(lastSeenInfo.lastSeen, isOnline)
                        : "Offline"}
                    </p>
                  </div>
                  <span className="text-base-content/50 max-[840px]:text-xs">•</span>
                  <p className="text-sm max-[840px]:text-xs text-base-content/70">
                    {messageCount} {messageCount === 1 ? "msg" : "msgs"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Responsive 3-dot Menu (Visible on screens ≤700px) */}
          <div
            className="relative block max-[700px]:block min-[701px]:hidden"
            ref={menuRef}
          >
            <button
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <MoreVertical className="size-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-base-100 shadow-lg rounded-md z-50 border border-base-300">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleDeleteChatHistory();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 w-full text-left transition-colors"
                    disabled={isBlockingUser}
                  >
                    Privacy+
                  </button>
                  <button
                    onClick={() => {
                      handleBlockToggle();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 w-full text-left transition-colors"
                    disabled={isBlockingUser}
                  >
                    {blockStatus.isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => {
                      handleRemoveFriend();
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 w-full text-left transition-colors"
                  >
                    Delete Friend
                  </button>
                  <hr className="my-1 border-base-300" />
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setShowMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 w-full text-left transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons (Hidden on screens ≤700px) */}
          <div className="hidden min-[701px]:flex items-center gap-2">
            {/* Privacy+ Button */}
            <button
              onClick={handleDeleteChatHistory}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 group"
              aria-label="Delete chat history"
              title="Delete chat history for both users (Privacy+)"
            >
              <Shield className="size-5 text-info group-hover:text-info-focus" />
            </button>

            {/* Block/Unblock Button */}
            <button
              onClick={handleBlockToggle}
              disabled={isBlockingUser}
              className={`btn btn-ghost btn-sm btn-circle hover:bg-base-200 group ${
                isBlockingUser ? "loading" : ""
              }`}
              aria-label={blockStatus.isBlocked ? "Unblock user" : "Block user"}
              title={blockStatus.isBlocked ? "Unblock user" : "Block user"}
            >
              {blockStatus.isBlocked ? (
                <CheckCircle className="size-5 text-warning group-hover:text-warning-focus" />
              ) : (
                <Ban className="size-5 text-orange-500 group-hover:text-orange-600" />
              )}
            </button>

            {/* Remove Friend Button */}
            <button
              onClick={handleRemoveFriend}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 group"
              aria-label="Remove friend"
              title="Remove friend"
            >
              <Trash2 className="size-5 text-error group-hover:text-error-focus" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
              aria-label="Close chat"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfile && selectedUser && (
        <UserProfile
          userId={selectedUser._id}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Block Confirmation Modal */}
      <BlockConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockConfirm}
        userName={selectedUser?.fullname}
        isBlocked={blockStatus.isBlocked}
        isLoading={isBlockingUser}
      />
    </div>
  );
};

export default ChatHeader;