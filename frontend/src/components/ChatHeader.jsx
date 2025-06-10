import { useState } from "react";
import { X, Users, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import GroupDetails from "./GroupDetails";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { selectedGroup, clearSelectedGroup } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  const handleClose = () => {
    if (selectedUser) {
      setSelectedUser(null);
    } else if (selectedGroup) {
      clearSelectedGroup();
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {selectedUser ? (
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              ) : (
                <img 
                  src={selectedGroup?.profilePic || "/group-placeholder.png"} 
                  alt={selectedGroup?.name} 
                />
              )}
            </div>
          </div>

          {/* User/Group info */}
          <div>
            <h3 className="font-medium">
              {selectedUser?.fullName || selectedGroup?.name}
            </h3>
            <p className="text-sm text-base-content/70">
              {selectedUser ? (
                onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"
              ) : (
                `${selectedGroup?.members?.length || 0} members`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Group details button */}
          {selectedGroup && (
            <button
              onClick={() => setShowGroupDetails(true)}
              className="p-2 rounded-full hover:bg-base-300"
              title="Group details"
            >
              <Info size={20} />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-base-300"
            title="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Group details sidebar */}
      {showGroupDetails && selectedGroup && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 lg:bg-transparent"
            onClick={() => setShowGroupDetails(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="relative z-50 w-full max-w-sm">
            <GroupDetails onClose={() => setShowGroupDetails(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;