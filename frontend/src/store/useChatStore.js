import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set,get) => ({
    messages : [],
    users : [],
    selectedUser : null,
    isUsersLoading : false,
    isMessagesLoading : false,

    getUsers : async () =>{
        set({isUsersLoading : true});
        try {
            const res = await axiosInstance.get("/message/users");
            set({users : res.data});
        } catch (error) {
            toast.error(error.response.data.message);
        }
        finally
        {
            set({isUsersLoading : false});
        }        
    },
    
    //retrieves chat history ,i.e,past messages
    getMessages : async (userId) =>{
        set({isMessagesLoading : true});

        try {
            const res = await axiosInstance.get(`/message/${userId}`);
            set({messages : res.data}); // Update the state with fetched messages
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages");
        }
        finally{
            set({isMessagesLoading : false});
        }
    },

    // make new entry in message database and update the messages state in UI 
    sendMessage : async(messageData)=>{
        const {selectedUser,messages} = get();
        try {
            const res = await axiosInstance.post(`/message/send/${selectedUser._id}`,messageData);
            set({messages : [...messages,res.data]});    
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    setSelectedUser : (selectedUser) => set({selectedUser}),

    subscribeToMessages: () => {
        const { selectedUser } = get();

        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Add logging to debug socket issues
        console.log("Subscribing to private messages for user:", selectedUser._id);

        socket.on("newMessage", (newMessage) => {
            console.log("Received message:", newMessage);
            
            // Ensure message is valid and relevant to current chat
            if (!newMessage) return;
            
            const currentUserId = useAuthStore.getState().authUser._id;
            const isSentByMe = newMessage.senderId._id === currentUserId;
            const isSentBySelectedUser = newMessage.senderId._id === selectedUser._id;
            const isReceivedByMe = newMessage.receiverId?._id === currentUserId;
            const isReceivedBySelectedUser = newMessage.receiverId?._id === selectedUser._id;
            
            // Only update messages if it's part of the current conversation
            if ((isSentByMe && isReceivedBySelectedUser) || 
                (isSentBySelectedUser && isReceivedByMe)) {
                console.log("Updating messages with:", newMessage);
                set({
                    messages: [...get().messages, newMessage]
                });
            }
        });
    },

    unsubscribeFromMessages : () =>{
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },
}));