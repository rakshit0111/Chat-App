import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    unsubscribeFromMessages,
    subscribeToMessages,
  } = useChatStore();
  
  const {
    groupMessages,
    getGroupMessages,
    isLoadingMessages: isGroupMessagesLoading,
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  // Determine active messages based on context (direct or group)
  const activeMessages = selectedGroup ? groupMessages : messages;
  const isLoading = selectedGroup ? isGroupMessagesLoading : isMessagesLoading;

  useEffect(() => {
    if (selectedUser) {
        getMessages(selectedUser._id); // Fetch direct chat messages
        subscribeToMessages(); // Subscribe to real-time updates
        return () => unsubscribeFromMessages(); // Unsubscribe on cleanup
    } else if (selectedGroup) {
        getGroupMessages(selectedGroup._id); // Fetch group chat messages
        subscribeToGroupMessages(); // Subscribe to real-time updates
        return () => unsubscribeFromGroupMessages(); // Unsubscribe on cleanup
    } else {
        unsubscribeFromMessages();
        unsubscribeFromGroupMessages();
    }
  }, [
    getMessages, 
    getGroupMessages, 
    selectedUser, 
    selectedGroup, 
    subscribeToMessages, 
    subscribeToGroupMessages, 
    unsubscribeFromMessages, 
    unsubscribeFromGroupMessages
  ]);

  useEffect(() => {
    if (activeMessages?.length && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Helper to get the sender name for group messages
  const getSenderName = (senderId) => {
    if (!selectedGroup) return "";

    if (senderId === authUser._id) return "You";

    // Find the member with the matching senderId
    const sender = selectedGroup.members.find((member) => member._id === senderId);

    // Return the sender's name or "Unknown User" if not found
    return sender ? sender.fullName : "Unknown User";
  };

  // Helper to get the sender avatar
  const getSenderAvatar = (senderId) => {
    if (senderId === authUser._id) {
      return authUser.profilePic || "/avatar.png";
    }

    if (selectedGroup) {
      const sender = selectedGroup.members.find((member) => member._id === senderId);
      return sender?.profilePic || "/avatar.png";
    }

    return selectedUser?.profilePic || "/avatar.png";
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeMessages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-base-content/60">
              {selectedGroup
                ? "No messages in this group yet. Say hi!"
                : "No messages yet. Start a conversation!"}
            </p>
          </div>
        )}

        {activeMessages.map((message, index) => {
          // Determine if the message is from the current user
          const isCurrentUser = message.senderId._id === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isCurrentUser ? "chat-end" : "chat-start"}`}
              ref={index === activeMessages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={getSenderAvatar(message.senderId._id)}
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                {selectedGroup && (
                  <span className="mr-2 font-medium text-xs">
                    {getSenderName(message.senderId._id)}
                  </span>
                )}
                <time className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;