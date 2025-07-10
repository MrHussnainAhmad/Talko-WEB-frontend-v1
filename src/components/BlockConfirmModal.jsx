import React from 'react';
import { Ban, CheckCircle } from 'lucide-react';

const BlockConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  isBlocked, 
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
          {isBlocked ? (
            <CheckCircle className="size-6 text-warning" />
          ) : (
            <Ban className="size-6 text-error" />
          )}
          <h3 className="text-lg font-semibold text-base-content">
            {isBlocked ? 'Unblock User' : 'Block User'}
          </h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-base-content/80 mb-3">
            {isBlocked 
              ? `Are you sure you want to unblock ${userName}?`
              : `Are you sure you want to block ${userName}?`
            }
          </p>
          
          {!isBlocked && (
            <div className="bg-base-200 rounded-lg p-3">
              <p className="text-sm text-base-content/70">
                They won't be able to:
              </p>
              <ul className="text-sm text-base-content/70 mt-2 space-y-1">
                <li>• See your profile picture</li>
                <li>• See your online status or last seen</li>
                <li>• Send you messages</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 ${
              isBlocked 
                ? 'btn-warning' 
                : 'btn-error'
            }`}
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-xs"></span>}
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockConfirmModal;
