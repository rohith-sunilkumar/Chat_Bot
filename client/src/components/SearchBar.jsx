import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useChat } from '../context/ChatContext'
import toast from 'react-hot-toast'

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { createConversation, selectConversation, fetchConversations } = useChat()
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }

      setLoading(true)
      try {
        const { data } = await api.get(`/users/search?query=${searchQuery}`)
        setSearchResults(data)
        setShowResults(true)
      } catch (error) {
        console.error('Search failed:', error)
        toast.error('Failed to search users')
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleUserClick = async (user) => {
    try {
      const conversation = await createConversation(user._id)
      selectConversation(conversation)
      setSearchQuery('')
      setShowResults(false)
      setSearchResults([])
      await fetchConversations()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search or start a new chat…"
          className="w-full pl-12 pr-12 py-3 glass-dark text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute left-0 right-0 mt-3 glass-dark rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 border border-white/10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((user) => {
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
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/8 cursor-pointer transition-all hover:transform hover:translate-x-1"
                  >
                    {hasValidAvatar(user.avatar) ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="avatar h-11 w-11 ring-2 ring-white/10"
                      />
                    ) : (
                      <div
                        className={`avatar-default ${getAvatarColor(user.username)} h-11 w-11 ring-2 ring-white/10`}
                        title={user.username}
                      >
                        {getInitials(user.username)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-name truncate">
                        {user.username}
                      </h3>
                      <p className="text-message truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar