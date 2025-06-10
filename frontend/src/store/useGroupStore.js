import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    isLoadingGroups: false,
    isLoadingMessages: false,
    isCreatingGroup: false,
    
    // Fetch all groups the user is a member of
    getGroups: async () => {
        set({ isLoadingGroups: true });
        try {
            const res = await axiosInstance.get("/groups");
            set({ groups: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load groups");
        } finally {
            set({ isLoadingGroups: false });
        }
    },
    
    // Create a new group
    createGroup: async (groupData) => {
        set({ isCreatingGroup: true });
        try {
            const res = await axiosInstance.post("/groups", groupData);
            set({ 
                groups: [...get().groups, res.data],
                selectedGroup: res.data 
            });
            toast.success("Group created successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            return null;
        } finally {
            set({ isCreatingGroup: false });
        }
    },
    
    // Update group details
    updateGroup: async (groupId, groupData) => {
        try {
            const res = await axiosInstance.put(`/groups/${groupId}`, groupData);
            
            // Update groups list
            const updatedGroups = get().groups.map(group => 
                group._id === groupId ? res.data : group
            );
            
            // Update selected group if it's the current one
            const { selectedGroup } = get();
            if (selectedGroup && selectedGroup._id === groupId) {
                set({ selectedGroup: res.data });
            }
            
            set({ groups: updatedGroups });
            toast.success("Group updated successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group");
            return null;
        }
    },
    
    // Add a member to the group
    addMember: async (groupId, memberId) => {
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberId });
            
            // Make sure we preserve the profilePic when updating
            const updatedGroups = get().groups.map(group => {
                if (group._id === groupId) {
                    // Return updated group but ensure profilePic is preserved
                    return {
                        ...res.data,
                        profilePic: res.data.profilePic || group.profilePic
                    };
                }
                return group;
            });
            
            // Update selected group if it's the current one
            const { selectedGroup } = get();
            if (selectedGroup && selectedGroup._id === groupId) {
                set({ 
                    selectedGroup: {
                        ...res.data,
                        profilePic: res.data.profilePic || selectedGroup.profilePic
                    } 
                });
            }
            
            set({ groups: updatedGroups });
            toast.success("Member added successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add member");
            return null;
        }
    },
    
    // Remove a member from the group
    removeMember: async (groupId, memberId) => {
        try {
            const res = await axiosInstance.delete(`/groups/${groupId}/members`, { 
                data: { memberId } 
            });
            
            const currentUserId = useAuthStore.getState().authUser._id;
            const isCurrentUser = memberId === currentUserId;
            
            // If current user is leaving the group
            if (isCurrentUser) {
                // Remove the group from the list
                const updatedGroups = get().groups.filter(group => group._id !== groupId);
                set({ groups: updatedGroups });
                
                // Clear selected group
                const { selectedGroup } = get();
                if (selectedGroup && selectedGroup._id === groupId) {
                    set({ selectedGroup: null, groupMessages: [] });
                }
            } else {
                // Just update the group member list but preserve profilePic
                const updatedGroups = get().groups.map(group => {
                    if (group._id === groupId) {
                        return {
                            ...res.data,
                            profilePic: res.data.profilePic || group.profilePic
                        };
                    }
                    return group;
                });
                
                // Update selected group if viewing it
                const { selectedGroup } = get();
                if (selectedGroup && selectedGroup._id === groupId) {
                    set({ 
                        selectedGroup: {
                            ...res.data,
                            profilePic: res.data.profilePic || selectedGroup.profilePic
                        }
                    });
                }
                
                set({ groups: updatedGroups });
            }
            
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
            return null;
        }
    },
    
    // Get messages for a specific group
    getGroupMessages: async (groupId) => {
        set({ isLoadingMessages: true });

        try {
            const res = await axiosInstance.get(`/groups/${groupId}/messages`);
            set({ groupMessages: res.data }); // Update the state with fetched messages
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
            set({ isLoadingMessages: false });
        }
    },
    
    // Send a message to the group
    sendGroupMessage: async (messageData) => {
        const { selectedGroup, groupMessages } = get();
        if (!selectedGroup) return;
        
        try {
            const res = await axiosInstance.post(`/message/send/${selectedGroup._id}`, {
                ...messageData,
                groupId: selectedGroup._id
            });
            
            set({ groupMessages: [...groupMessages, res.data] });
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
            return null;
        }
    },
    
    // Set the selected group
    setSelectedGroup: (group) => {
        set({ selectedGroup: group });
        if (group) {
            const socket = useAuthStore.getState().socket;
            if (socket) {
                socket.emit("joinGroup", group._id);
            }
        }
    },
    
    // Clear the selected group
    clearSelectedGroup: () => {
        const { selectedGroup } = get();
        if (selectedGroup) {
            const socket = useAuthStore.getState().socket;
            if (socket) {
                socket.emit("leaveGroup", selectedGroup._id);
            }
        }
        set({ selectedGroup: null, groupMessages: [] });
    },
    
    // Subscribe to group messages
    subscribeToGroupMessages: () => {
        const { selectedGroup } = get();
        if (!selectedGroup) return;
        
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        socket.on("newGroupMessage", (message) => {
            if (message.groupId !== selectedGroup._id) return;
            set({ groupMessages: [...get().groupMessages, message] });
        });
        
        socket.on("groupUpdated", (updatedGroup) => {
            if (updatedGroup._id !== selectedGroup._id) return;
            
            // Preserve profilePic when receiving group updates
            set({ 
                selectedGroup: {
                    ...updatedGroup,
                    profilePic: updatedGroup.profilePic || selectedGroup.profilePic
                }
            });
            
            // Also update in the groups list
            const updatedGroups = get().groups.map(group => {
                if (group._id === updatedGroup._id) {
                    return {
                        ...updatedGroup,
                        profilePic: updatedGroup.profilePic || group.profilePic
                    };
                }
                return group;
            });
            
            set({ groups: updatedGroups });
        });
    },
    
    // Unsubscribe from group messages
    unsubscribeFromGroupMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        socket.off("newGroupMessage");
        socket.off("groupUpdated");
    }
}));
