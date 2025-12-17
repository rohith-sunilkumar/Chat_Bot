import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { format, isToday, isYesterday } from 'date-fns'
import { useState } from 'react'

const ChatList = () => {
  const { conversations, selectedConversation, selectConversation } = useChat()
  const { user } = useAuth()
  const { onlineUsers } = useSocket()
  const [expandedSections, setExpandedSections] = useState({ groups: true, person: true })

  // Get initials from username
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Generate consistent color based on username
  const getAvatarColor = (name) => {
    if (!name) return 'color-1'
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    const colorIndex = (Math.abs(hash) % 8) + 1
    return `color-${colorIndex}`
  }

  // Check if avatar URL is valid
  const hasValidAvatar = (avatarUrl) => {
    return avatarUrl &&
      avatarUrl !== 'https://via.placeholder.com/150' &&
      !avatarUrl.includes('ui-avatars.com')
  }

  const formatLastMessageTime = (date) => {
    if (!date) return ''
    const messageDate = new Date(date)

    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    } else if (isYesterday(messageDate)) {
      return 'Yesterday'
    } else {
      return format(messageDate, 'MMM dd')
    }
  }

  const getConversationName = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.name
    }
    const otherUser = conversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser?.username || 'Unknown'
  }

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.groupAvatar || null
    }
    const otherUser = conversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser?.avatar || null
  }

  const isUserOnline = (conversation) => {
    if (conversation.isGroupChat) return false
    const otherUser = conversation.participants.find(
      (p) => p._id !== user._id
    )
    return otherUser && onlineUsers.has(otherUser._id)
  }

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet'

    const message = conversation.lastMessage
    const isSentByMe = message.sender === user._id
    const prefix = isSentByMe ? 'You: ' : ''

    return `${prefix}${message.content}`
  }

  const groupConversations = conversations.filter(c => c.isGroupChat)
  const personalConversations = conversations.filter(c => !c.isGroupChat)

  const ConversationItem = ({ conversation }) => {
    const isActive = selectedConversation?._id === conversation._id
    const unreadCount = 0 // TODO: Implement unread count logic

    return (
      <div
        onClick={() => selectConversation(conversation)}
        className={`chat-list-item mx-2 ${isActive ? 'active' : ''}`}
      >
        <div className="relative flex-shrink-0">
          {hasValidAvatar(getConversationAvatar(conversation)) ? (
            <img
              src={getConversationAvatar(conversation)}
              alt={getConversationName(conversation)}
              className="avatar h-12 w-12 ring-2 ring-white/10"
            />
          ) : (
            <div
              className={`avatar-default ${getAvatarColor(getConversationName(conversation))} h-12 w-12 ring-2 ring-white/10`}
              title={getConversationName(conversation)}
            >
              {getInitials(getConversationName(conversation))}
            </div>
          )}
          {isUserOnline(conversation) && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-gray-900 rounded-full ring-2 ring-green-400/30"></span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-name truncate">
              {getConversationName(conversation)}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <span className="text-time">
                {formatLastMessageTime(conversation.updatedAt)}
              </span>
              {unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </div>
          </div>
          <p className="text-message truncate">
            {getLastMessagePreview(conversation)}
          </p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-gray-900 text-lg font-semibold mb-2">No conversations yet</h3>
        <p className="text-gray-600 text-sm max-w-xs">
          Search for users above to start chatting!
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full py-2">
      {/* Groups Section */}
      {groupConversations.length > 0 && (
        <div className="mb-6">
          <h2 className="section-label">
            Groups ({groupConversations.length})
          </h2>
          <div className="space-y-1">
            {groupConversations.map((conversation) => (
              <ConversationItem key={conversation._id} conversation={conversation} />
            ))}
          </div>
        </div>
      )}

      {/* Direct Messages Section */}
      {personalConversations.length > 0 && (
        <div>
          <h2 className="section-label">
            Direct Messages ({personalConversations.length})
          </h2>
          <div className="space-y-1">
            {personalConversations.map((conversation) => (
              <ConversationItem key={conversation._id} conversation={conversation} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatList