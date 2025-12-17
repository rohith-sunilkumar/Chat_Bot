import { useEffect, useRef, useMemo, useCallback, memo, useState } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import Message from './Message'
import MessageInput from './MessageInput'
import { Phone, Video, MoreVertical, ArrowLeft, MessageCircle, Trash2, BellOff, UserX, Archive, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const ChatBox = ({ onBack }) => {
  const { selectedConversation, messages, loading, typingUsers, deleteConversation } = useChat()
  const [showMenu, setShowMenu] = useState(false)
  const { user } = useAuth()
  const { onlineUsers } = useSocket()
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Avatar helper functions
  const getInitials = useCallback((name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }, [])

  const getAvatarColor = useCallback((name) => {
    if (!name) return 'color-1'
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    const colorIndex = (Math.abs(hash) % 8) + 1
    return `color-${colorIndex}`
  }, [])

  const hasValidAvatar = useCallback((avatarUrl) => {
    return avatarUrl &&
      avatarUrl !== 'https://via.placeholder.com/150' &&
      !avatarUrl.includes('ui-avatars.com')
  }, [])

  // Memoize computed values to prevent recalculation on every render
  const conversationName = useMemo(() => {
    if (!selectedConversation) return '';
    if (selectedConversation.isGroupChat) {
      return selectedConversation.name
    }
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser?.username || 'Unknown'
  }, [selectedConversation, user._id])

  const conversationAvatar = useMemo(() => {
    if (!selectedConversation) return '';
    if (selectedConversation.isGroupChat) {
      return selectedConversation.groupAvatar || 'https://ui-avatars.com/api/?name=Group&background=random'
    }
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.username}&background=random`
  }, [selectedConversation, user._id])

  const onlineStatus = useMemo(() => {
    if (!selectedConversation) return 'Offline';
    if (selectedConversation.isGroupChat) {
      const onlineCount = selectedConversation.participants.filter(
        (p) => p._id !== user._id && onlineUsers.has(p._id)
      ).length
      return onlineCount > 0 ? `${onlineCount} online` : 'Offline'
    }
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser && onlineUsers.has(otherUser._id) ? 'Online' : 'Offline'
  }, [selectedConversation, user._id, onlineUsers])

  const isTyping = selectedConversation ? typingUsers[selectedConversation._id] : false

  // Menu handlers
  const handleDeleteChat = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await deleteConversation(selectedConversation._id)
        setShowMenu(false)
        if (onBack) onBack()
      } catch (error) {
        // Error already handled in deleteConversation
      }
    }
  }, [selectedConversation, deleteConversation, onBack])

  const handleMuteChat = useCallback(() => {
    // TODO: Implement mute functionality
    toast.success('Conversation muted')
    setShowMenu(false)
  }, [])

  const handleBlockUser = useCallback(() => {
    if (window.confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) {
      // TODO: Implement block user API call
      toast.success('User blocked')
      setShowMenu(false)
      if (onBack) onBack()
    }
  }, [onBack])

  const handleArchiveChat = useCallback(() => {
    // TODO: Implement archive functionality
    toast.success('Conversation archived')
    setShowMenu(false)
  }, [])

  const handleViewInfo = useCallback(() => {
    // TODO: Implement view conversation info
    toast.info('Conversation info')
    setShowMenu(false)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center glass-dark rounded-3xl">
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-gray-900 text-xl font-semibold mb-2">Welcome to Chat</h3>
          <p className="text-gray-600 text-sm max-w-md">
            Select a conversation from the sidebar to start messaging, or search for someone new to chat with.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col glass-dark rounded-3xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="h-16 px-4 border-b border-white/8 flex items-center justify-between glass-dark">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </button>

          {hasValidAvatar(conversationAvatar) ? (
            <img
              src={conversationAvatar}
              alt={conversationName}
              className="avatar h-10 w-10 ring-2 ring-white/20"
            />
          ) : (
            <div
              className={`avatar-default ${getAvatarColor(conversationName)} h-10 w-10 ring-2 ring-white/20`}
              title={conversationName}
            >
              {getInitials(conversationName)}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-900 text-sm leading-tight">
              {conversationName}
            </h2>
            <p className="text-xs text-gray-600 leading-tight">
              {onlineStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Video className="h-5 w-5 text-gray-600" />
          </button>
          {/* More Options Menu */}
          <div className="menu-container relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl py-2 z-[100] animate-fadeIn"
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <button
                  onClick={handleViewInfo}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 transition-colors text-left rounded-lg"
                >
                  <Info className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="text-white text-sm font-medium">View Info</div>
                    <div className="text-gray-400 text-xs">See conversation details</div>
                  </div>
                </button>

                <button
                  onClick={handleMuteChat}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 transition-colors text-left rounded-lg"
                >
                  <BellOff className="h-5 w-5 text-yellow-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Mute</div>
                    <div className="text-gray-400 text-xs">Stop notifications</div>
                  </div>
                </button>

                <button
                  onClick={handleArchiveChat}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 transition-colors text-left rounded-lg"
                >
                  <Archive className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Archive</div>
                    <div className="text-gray-400 text-xs">Hide from chat list</div>
                  </div>
                </button>

                <div className="h-px bg-white/20 my-2 mx-2"></div>

                <button
                  onClick={handleBlockUser}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/20 transition-colors text-left rounded-lg"
                >
                  <UserX className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Block User</div>
                    <div className="text-gray-400 text-xs">Stop all communication</div>
                  </div>
                </button>

                <button
                  onClick={handleDeleteChat}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition-colors text-left"
                >
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <div>
                    <div className="text-red-400 text-sm font-medium">Delete Chat</div>
                    <div className="text-gray-400 text-xs">Remove conversation</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <Message key={message._id || `temp-${index}-${Date.now()}`} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 mb-4">
                <div className="message-bubble-received px-4 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(ChatBox)