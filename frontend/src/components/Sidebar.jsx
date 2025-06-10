import { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import { CircleUserRound, Users, Plus } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groups, getGroups, selectedGroup, setSelectedGroup, clearSelectedGroup, isLoadingGroups } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filteredUsers = showOnlineOnly ? users.filter(user => onlineUsers.includes(user._id)) : users;

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    clearSelectedGroup();
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  if (isUsersLoading)
    return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-base-300">
          <button
            className={`flex-1 py-3 px-4 text-center ${activeTab === 'chats' ? 'border-b-2 border-primary font-medium items-center justify-center' : 'text-base-content/70'}`}
            onClick={() => setActiveTab('chats')}
          >
            <div className="flex justify-center lg:justify-start items-center gap-2">
              <CircleUserRound className="size-5" />
              <span className="hidden lg:inline">Chats</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center ${activeTab === 'groups' ? 'border-b-2 border-primary font-medium items-center justify-center' : 'text-base-content/70'}`}
            onClick={() => setActiveTab('groups')}
          >
            <div className="flex flex-row items-align justify-center  lg:justify-start items-center gap-2">
              <Users className="size-5" />
              <span className="hidden lg:inline">Groups</span>
            </div>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'chats' ? (
          <>
            <div className="border-b border-base-300 w-full p-5">
              {/* Online filter toggle */}
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2 text-sm md:text-base lg:text-lg">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                 
                </label>
                <span className="hidden lg:inline text-xs lg:text-sm text-zinc-500 truncate">({onlineUsers.length - 1} online)</span>
              </div>
            </div>

            <div className='overflow-y-auto w-full py-3'>
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    cursor-pointer hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-10 sm:size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-base-100"
                      />
                    )}
                  </div>

                  {/* User info - only visible on larger screens */}
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">No users found</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-xs uppercase text-base-content/70">Your Groups</h3>
                <button 
                  className="btn btn-xs btn-ghost btn-circle"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-1">
                {groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => handleGroupSelect(group)}
                    className={`
                      w-full py-2 px-3 flex items-center gap-3 rounded-lg
                      cursor-pointer hover:bg-base-300 transition-colors
                      ${selectedGroup?._id === group._id ? "bg-base-300" : ""}
                    `}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      <img
                        src={group.profilePic || "/group-placeholder.png"}
                        alt={group.name}
                        className="size-10 sm:size-12 object-cover rounded-full"
                      />
                    </div>

                    {/* Group info - only visible on larger screens */}
                    <div className="hidden lg:block text-left min-w-0 flex-1">
                      <div className="font-medium truncate">{group.name}</div>
                      <div className="text-sm text-zinc-400 truncate">
                        {group.members.length} members
                      </div>
                    </div>
                  </button>
                ))}

                {groups.length === 0 && (
                  <div className="text-center text-zinc-500 py-4 px-2">
                    <p>No groups yet</p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="btn btn-xs btn-ghost mt-2"
                    >
                      Create your first group
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </>
  );
};

export default Sidebar;