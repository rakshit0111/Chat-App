import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { X, Upload, Camera, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [],
    profilePic: ""
  });
  const [previewPic, setPreviewPic] = useState(null);
  const fileInputRef = useRef(null);
  
  const { users } = useChatStore();
  const { createGroup, isCreatingGroup } = useGroupStore();
  
  if (!isOpen) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMemberToggle = (userId) => {
    setFormData(prev => {
      if (prev.members.includes(userId)) {
        return { ...prev, members: prev.members.filter(id => id !== userId) };
      } else {
        return { ...prev, members: [...prev.members, userId] };
      }
    });
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
    
    if (formData.members.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    const result = await createGroup(formData);
    if (result) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create New Group</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-base-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group Profile Picture */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-base-300 flex items-center justify-center">
                {previewPic ? (
                  <img src={previewPic} alt="Group preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-base-content/50" />
                )}
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
            <span className="text-xs text-base-content/60">Group Picture</span>
          </div>
          
          {/* Group Name */}
          <div className="form-control">
          <label className="block text-sm font-medium text-base-content mb-1">Group Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input input-bordered"
              placeholder="Enter group name"
            />
          </div>
          
          {/* Group Description */}
          <div className="form-control">
            <label className="block text-sm font-medium text-base-content mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="textarea textarea-bordered w-full resize-none text-sm"
              placeholder="What's this group about?"
              rows="3"
            />
          </div>
          
          {/* Members Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Add Members*</span>
              <span className="label-text-alt">{formData.members.length} selected</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-base-300 rounded-lg">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                  onClick={() => handleMemberToggle(user._id)}
                >
                  <div className="flex-1 flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                      </div>
                    </div>
                    <span className="text-sm font-medium">{user.fullName}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    formData.members.includes(user._id) ? "bg-primary border-primary" : "border-base-content/30"
                  }`}>
                    {formData.members.includes(user._id) && (
                      <Plus className="w-3 h-3 text-primary-content rotate-45" />
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-3 text-center text-base-content/60 text-sm">
                  No users found
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isCreatingGroup}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup}
            >
              {isCreatingGroup ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
