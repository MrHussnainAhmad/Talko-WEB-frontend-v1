import React, { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X } from "lucide-react";
import BlockedUserModal from './BlockedUserModal';
import { toast } from "react-hot-toast";

const MessageInput = ({ isBlocked = false, isBlockedBy = false, selectedUser }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, emitTyping, emitStopTyping } = useChatStore();
  const { unblockUser } = useAuthStore();

  const handleSelectImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImg = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
// Emit typing event - don't emit if user is blocked
  useEffect(() => {
    if (!selectedUser || isBlocked) return;

    if (text.trim()) {
      if (!isTyping) {
        emitTyping(selectedUser._id);
        setIsTyping(true);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(selectedUser._id);
        setIsTyping(false);
      }, 2000);
    } else {
      if (isTyping) {
        emitStopTyping(selectedUser._id);
        setIsTyping(false);
      }
    }
  }, [text, selectedUser, emitTyping, emitStopTyping, isTyping, isBlocked]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && selectedUser) {
        emitStopTyping(selectedUser._id);
      }
    };
  }, []);

  const handleConfirmSendBlocked = async () => {
    setIsSendingMessage(true);
    try {
      // First unblock the user
      await unblockUser(selectedUser._id);
      
      // Then send the message
      await sendMessage({ 
        text: text.trim(), 
        image: imagePreview 
      });
      
      // Clear the input
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast.success("User unblocked and message sent!");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSendingMessage(false);
      setShowBlockedModal(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview) return;

    // If user A blocked user B, show modal
    if (isBlocked) {
      setShowBlockedModal(true);
      return;
    }
    
    // If user B is blocked by user A, show error
    if (isBlockedBy) {
      toast.error("You cannot send messages to this user");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      clearTimeout(typingTimeoutRef.current);
      if (selectedUser) {
        emitStopTyping(selectedUser._id);
      }
      setIsTyping(false);

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      <BlockedUserModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onConfirm={handleConfirmSendBlocked}
        userName={selectedUser?.fullname}
        isLoading={isSendingMessage}
      />
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={handleRemoveImg}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleSelectImg}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
