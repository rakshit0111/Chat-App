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
            set({messages : res.data});
        } catch (error) {
            toast.error(error.response.data.message);
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

    subscribeToMessages : () =>{
        const {selectedUser} = get();

        if(!selectedUser)
            return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage",(newMessage)=>{

            if(newMessage.senderId !== selectedUser._id)
                return;
            set({
                messages : [...get().messages,newMessage]//receives the message document emitted and updates
            })
        });

    },

    unsubscribeFromMessages : () =>{
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },
}));