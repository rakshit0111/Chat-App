import { useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import { X, Image, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);
  
  const { selectedUser, sendMessage } = useChatStore();
  const { selectedGroup, sendGroupMessage } = useGroupStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an Image File");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    }; //when file reading completes the arrow function will be executed

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);

    if (fileRef.current)
      fileRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!imagePreview && !text.trim()) {
        return;
    }

    const messageData = {
        text: text.trim(),
        image: imagePreview,
    };

    try {
        let success = false;

        if (selectedGroup) {
            success = await sendGroupMessage(messageData);
        } else if (selectedUser) {
            success = await sendMessage(messageData);
            // We don't need to manually emit via socket here anymore
            // The server will handle both sender and receiver updates
        }

        if (success !== false) {
            setText("");
            setImagePreview(null);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }
    } catch (error) {
        console.error("Failed to send Message", error);
    }
  };

  return (
    <div className='p-4 w-full'>
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
            flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
        <div className='flex-1 flex gap-2'>
          <input
            type='text'
            placeholder='Type a message'
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
          />
          <input
            type='file'
            accept='image/*'
            className='hidden'
            ref={fileRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type='submit'
          className='btn btn-sm btn-circle'
          disabled={!imagePreview && !text.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;