import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { MessageCircle, Users, Settings, Power } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import ChatList from '../components/ChatList'
import ChatBox from '../components/ChatBox'
import ContactsView from '../components/OnlineStatus'
import SettingsView from '../components/TypingIndicator'
import ProfileView from '../components/UserAvatar'

const ChatPage = () => {
  const { user, logout } = useAuth()
  const { fetchConversations, selectedConversation, selectConversation } = useChat()
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [activeTab, setActiveTab] = useState('chats')

  // Avatar helper functions
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (name) => {
    if (!name) return 'color-1'
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    const colorIndex = (Math.abs(hash) % 8) + 1
    return `color-${colorIndex}`
  }

  const hasValidAvatar = (avatarUrl) => {
    return avatarUrl &&
      avatarUrl !== 'https://via.placeholder.com/150' &&
      !avatarUrl.includes('ui-avatars.com')
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      setShowMobileChat(true)
    }
  }, [selectedConversation])

  const handleBackToList = () => {
    setShowMobileChat(false)
    selectConversation(null)
  }

  const navItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="h-screen flex overflow-hidden chat-bg">
      {/* Left Sidebar */}
      <div className="hidden lg:flex w-20 glass-dark flex-col items-center py-6 space-y-8 border-r border-gray-200">
        {/* User Avatar */}
        <div
          className="relative group cursor-pointer tooltip"
          onClick={() => setActiveTab('profile')}
          data-tooltip="Profile"
        >
          {hasValidAvatar(user?.avatar) ? (
            <img
              src={user.avatar}
              alt={user?.username}
              className="avatar h-12 w-12 ring-2 ring-purple-200 hover:ring-purple-400 transition-all"
            />
          ) : (
            <div
              className={`avatar-default ${getAvatarColor(user?.username)} h-12 w-12 ring-2 ring-purple-200 hover:ring-purple-400 transition-all`}
              title={user?.username}
            >
              {getInitials(user?.username)}
            </div>
          )}
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-gray-900 rounded-full ring-2 ring-green-400/30"></div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`tooltip p-3.5 rounded-xl transition-all ${isActive
                  ? 'bg-purple-500/30 text-gray-900 shadow-lg shadow-purple-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50'
                  }`}
                data-tooltip={item.label}
              >
                <Icon className="h-6 w-6" />
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="tooltip p-3.5 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
          data-tooltip="Logout"
        >
          <Power className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render different views based on activeTab */}
        {activeTab === 'profile' && <ProfileView />}

        {activeTab === 'chats' && (
          <>
            {/* Conversations List */}
            <div className={`${showMobileChat ? 'hidden' : 'flex'
              } lg:flex flex-col w-full lg:w-96 glass-dark m-4 rounded-3xl overflow-hidden panel-separator`}>
              {/* Search Bar */}
              <div className="p-4 border-b border-white/5">
                <SearchBar />
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-hidden">
                <ChatList />
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${showMobileChat ? 'flex' : 'hidden'
              } lg:flex flex-1 my-4 ml-0`}>
              <ChatBox onBack={handleBackToList} />
            </div>
          </>
        )}

        {activeTab === 'contacts' && (
          <ContactsView onStartChat={() => setActiveTab('chats')} />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Mobile Bottom Navigation - Hidden when in active chat */}
      {!showMobileChat && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-dark border-t border-gray-200 h-16 z-50">
          <div className="flex justify-around items-center h-full">
            {/* Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === 'profile'
                ? 'bg-purple-500/30 text-gray-900'
                : 'text-gray-600'
                }`}
            >
              <div className="relative">
                {hasValidAvatar(user?.avatar) ? (
                  <img
                    src={user.avatar}
                    alt={user?.username}
                    className="h-6 w-6 rounded-full ring-2 ring-purple-200"
                  />
                ) : (
                  <div className={`avatar-default ${getAvatarColor(user?.username)} h-6 w-6 text-xs ring-2 ring-purple-200`}>
                    {getInitials(user?.username)}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-green-500 border border-white rounded-full"></div>
              </div>
              <span className="text-xs font-medium">Profile</span>
            </button>

            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive
                    ? 'bg-purple-500/30 text-gray-900'
                    : 'text-gray-600'
                    }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              )
            })}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-600 transition-all"
            >
              <Power className="h-6 w-6" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage
