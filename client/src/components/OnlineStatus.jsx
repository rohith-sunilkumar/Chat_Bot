import { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Search, UserPlus, MessageCircle, Hash, Users, UserCheck, Filter, SortAsc } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ContactsView = ({ onStartChat }) => {
  const { user } = useAuth()
  const { conversations, createConversation, selectConversation } = useChat()
  const { onlineUsers } = useSocket()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('') // Separate input state
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [userIdSearch, setUserIdSearch] = useState('')
  const [searchingById, setSearchingById] = useState(false)
  const [filterOnline, setFilterOnline] = useState(false)
  const [sortBy, setSortBy] = useState('name') // 'name' or 'status'
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    setSearching(true)
    try {
      // Call the search API endpoint
      const { data } = await api.get(`/users/search?query=${encodeURIComponent(searchInput.trim())}`)

      // data is now an array
      if (data.length > 0) {
        const foundUser = data[0]
        // Add the found user to the allUsers list if not already there
        setAllUsers(prevUsers => {
          const userExists = prevUsers.some(u => u._id === foundUser._id)
          if (userExists) {
            return prevUsers
          }
          return [...prevUsers, foundUser]
        })

        // Set search query to filter and show the found user
        setSearchQuery(searchInput)
        toast.success(`Found user: ${foundUser.username}`)
      } else {
        toast.error('User not found. Try searching by exact email address.')
        setSearchQuery(searchInput)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error(error.response?.data?.message || 'Search failed')
      // Still set search query to filter local users
      setSearchQuery(searchInput)
    } finally {
      setSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    fetchAllUsers() // Refresh the users list
  }

  const fetchAllUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setAllUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async (userId) => {
    try {
      const conversation = await createConversation(userId)
      selectConversation(conversation)
      if (onStartChat) onStartChat()
    } catch (error) {
      console.error('Failed to start chat:', error)
    }
  }

  // Filter and sort users
  let filteredUsers = allUsers.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Apply online filter
  if (filterOnline) {
    filteredUsers = filteredUsers.filter(u => onlineUsers.has(u._id))
  }

  // Sort users
  filteredUsers.sort((a, b) => {
    if (sortBy === 'status') {
      const aOnline = onlineUsers.has(a._id)
      const bOnline = onlineUsers.has(b._id)
      if (aOnline && !bOnline) return -1
      if (!aOnline && bOnline) return 1
    }
    return a.username.localeCompare(b.username)
  })

  const existingContactIds = new Set(
    conversations
      .filter(c => !c.isGroupChat)
      .flatMap(c => c.participants.map(p => p._id))
      .filter(id => id !== user._id)
  )

  // Calculate stats
  const totalContacts = allUsers.length
  const onlineCount = allUsers.filter(u => onlineUsers.has(u._id)).length
  const withConversations = allUsers.filter(u => existingContactIds.has(u._id)).length

  // Calculate group chats count
  const groupChatsCount = conversations.filter(c => c.isGroupChat).length

  return (
    <div className="flex-1 glass-dark rounded-3xl m-4 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h1>
        <p className="text-gray-600 text-sm">Manage your contacts and start new conversations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Conversations */}
        <div className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{conversations.length}</div>
          <div className="text-sm text-gray-600">Total Conversations</div>
        </div>

        {/* Contacts */}
        <div className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalContacts}</div>
          <div className="text-sm text-gray-600">Contacts</div>
        </div>

        {/* Group Chats */}
        <div className="glass-dark p-6 rounded-2xl hover:bg-white/5 transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{groupChatsCount}</div>
          <div className="text-sm text-gray-600">Group Chats</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-10 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchInput.trim() || searching}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors flex items-center space-x-2"
        >
          {searching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No contacts found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((contact) => {
            const isOnline = onlineUsers.has(contact._id)
            const hasConversation = existingContactIds.has(contact._id)

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

            return (
              <div
                key={contact._id}
                className="group flex items-center justify-between p-4 glass-dark rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => handleStartChat(contact._id)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative">
                    {hasValidAvatar(contact.avatar) ? (
                      <img
                        src={contact.avatar}
                        alt={contact.username}
                        className="h-12 w-12 rounded-full ring-2 ring-white/10 group-hover:ring-white/30 transition-all"
                      />
                    ) : (
                      <div
                        className={`avatar-default ${getAvatarColor(contact.username)} h-12 w-12 ring-2 ring-white/10 group-hover:ring-white/30 transition-all`}
                        title={contact.username}
                      >
                        {getInitials(contact.username)}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-gray-800 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-gray-900 font-medium text-sm truncate">{contact.username}</h3>
                      {hasConversation && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex-shrink-0">
                          Active
                        </span>
                      )}
                      {isOnline && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex-shrink-0">
                          Online
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs truncate">{contact.email}</p>
                    {contact.bio && (
                      <p className="text-gray-500 text-xs truncate mt-0.5">{contact.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartChat(contact._id)
                    }}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={hasConversation ? 'Open chat' : 'Start chat'}
                  >
                    <MessageCircle className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ContactsView