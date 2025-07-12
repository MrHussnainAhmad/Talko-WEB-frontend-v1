import React from 'react';
import { Ban, Send } from 'lucide-react';

const BlockedUserModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  isLoading 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Ban className="size-6 text-warning" />
          <h3 className="text-lg font-semibold text-base-content">
            Blocked User
          </h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-base-content/80 mb-3">
            You have blocked {userName}. Want to unblock to send message?
          </p>
          
          <div className="bg-base-200 rounded-lg p-3">
            <p className="text-sm text-base-content/70">
              If you choose "Yes", {userName} will be unblocked and your message will be sent.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              // Show toast message for "No" option
              import('react-hot-toast').then(({ toast }) => {
                toast.error("Can't send messages to blocked users");
              });
            }}
            className="btn btn-ghost flex-1"
            disabled={isLoading}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary flex-1"
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-xs"></span>}
            Yes, unblock & send
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedUserModal;
