import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { X, Edit2, Upload, UserPlus, UserMinus, LogOut } from "lucide-react";
import toast from "react-hot-toast";

const GroupDetails = ({ onClose }) => {
  const { selectedGroup, updateGroup, addMember, removeMember, getGroups } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedGroup?.name || "",
    description: selectedGroup?.description || "",
    profilePic: selectedGroup?.profilePic || "",
  });
  const [previewPic, setPreviewPic] = useState(selectedGroup?.profilePic || null);
  const fileInputRef = useRef(null);
  
  const [showAddMembers, setShowAddMembers] = useState(false);
  
  const isAdmin = selectedGroup?.admin === authUser?._id;
  
  // Filter users who are not already members
  const nonMembers = users.filter(
    user => !selectedGroup?.members.some(member => member._id === user._id)
  );
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPic(reader.result);
      setFormData(prev => ({ ...prev, profilePic: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    const result = await updateGroup(selectedGroup._id, formData);
    if (result) {
      setIsEditing(false);
    }
  };
  
  // Optimize the add member functionality
  const handleAddMember = async (memberId) => {
    try {
      const result = await addMember(selectedGroup._id, memberId);
      if (result) {
        toast.success(`Member added successfully!`);
        setShowAddMembers(false);
      }
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  // Optimize the remove member functionality
  const handleRemoveMember = async (memberId) => {
    try {
      // Only filter from the group list if user is removing themselves
      const isCurrentUser = memberId === authUser._id;
      const result = await removeMember(selectedGroup._id, memberId);
      
      if (result) {
        if (isCurrentUser) {
          // If user is removing themselves, close panel and refresh groups
          onClose();
          await getGroups();
        } else {
          toast.success("Member removed successfully!");
        }
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };
  
  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      const result = await removeMember(selectedGroup._id, authUser._id);
      if (result) {
        onClose(); // Close the group details sidebar
        await getGroups(); // Refresh the group list
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-base-100 border-l border-base-300">
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <h2 className="font-semibold">Group Details</h2>
        <button onClick={onClose} className="p-1 hover:bg-base-200 rounded-full">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Edit Profile Picture */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-base-300">
                  <img 
                    src={previewPic || "/group-placeholder.png"} 
                    alt="Group" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-content"
                >
                  <Upload size={14} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePicChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            
            {/* Group Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Group Name*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input input-bordered"
              />
            </div>
            
            {/* Group Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="textarea textarea-bordered"
                rows={3}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Group Info */}
            <div className="flex flex-col items-center space-y-3 mb-6">
              <div className="relative">
                <img
                  src={selectedGroup?.profilePic || "/group-placeholder.png"}
                  alt={selectedGroup?.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-base-300 hover:bg-base-200"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{selectedGroup?.name}</h3>
                <p className="text-sm text-base-content/70">
                  {selectedGroup?.members?.length} members • Created on {
                    new Date(selectedGroup?.createdAt).toLocaleDateString()
                  }
                </p>
              </div>
              {selectedGroup?.description && (
                <p className="text-sm text-center max-w-xs">
                  {selectedGroup.description}
                </p>
              )}
            </div>
            
            {/* Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Group Members</h4>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMembers(!showAddMembers)}
                    className="btn btn-sm btn-ghost gap-1"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                )}
              </div>
              
              {/* Add Members UI */}
              {showAddMembers && (
                <div className="mb-4 border border-base-300 rounded-lg overflow-hidden">
                  <div className="p-2 bg-base-200 border-b border-base-300 text-sm font-medium">
                    Add new members
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {nonMembers.length > 0 ? (
                      nonMembers.map(user => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-2 hover:bg-base-200 border-b border-base-300 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full">
                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                              </div>
                            </div>
                            <span className="text-sm">{user.fullName}</span>
                          </div>
                          <button
                            onClick={() => handleAddMember(user._id)}
                            className="btn btn-xs btn-ghost"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-base-content/60 text-sm">
                        No users to add
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Members List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedGroup?.members?.map(member => {
                  const isCurrentUser = member._id === authUser?._id;
                  const isMemberAdmin = member._id === selectedGroup.admin;
                  
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full">
                            <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {member.fullName} {isCurrentUser && "(You)"}
                          </span>
                          {isMemberAdmin && (
                            <span className="text-xs text-primary ml-1">Admin</span>
                          )}
                        </div>
                      </div>
                      
                      {isAdmin && !isMemberAdmin && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="btn btn-xs btn-ghost text-error"
                          title="Remove member"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Bottom Actions */}
      {!isEditing && !isAdmin && (
        <div className="p-4 border-t border-base-300">
          <button
            onClick={handleLeaveGroup}
            className="btn btn-error w-full gap-2"
          >
            <LogOut size={16} />
            Leave Group
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
