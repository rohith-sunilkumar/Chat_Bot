import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../utils/api'
import { useSocket } from './SocketContext'
import toast from 'react-hot-toast'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const { socket } = useSocket()

  // Use ref to track selected conversation for socket handlers
  const selectedConversationRef = useRef(null)
  // Track the currently joined conversation room
  const joinedConversationRef = useRef(null)

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('Received new message:', message)

      // Always update conversation last message
      updateConversationLastMessage(message)

      // Get message conversation ID
      const messageConvId = typeof message.conversation === 'object'
        ? message.conversation._id
        : message.conversation

      // Only add to messages if it's for the currently selected conversation
      if (selectedConversationRef.current && messageConvId === selectedConversationRef.current._id) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some(msg => msg._id === message._id)
          if (exists) return prev

          // Add message to state
          return [...prev, message]
        })
      }
    }

    const handleUserTyping = ({ userId, conversationId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: isTyping ? userId : null,
      }))
    }

    const handleMessageRead = ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, readBy: [...(msg.readBy || []), { user: userId }] }
            : msg
        )
      )
    }

    const handleMessageDelivered = ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, deliveredTo: [...(msg.deliveredTo || []), { user: userId }] }
            : msg
        )
      )
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('userTyping', handleUserTyping)
    socket.on('messageRead', handleMessageRead)
    socket.on('messageDelivered', handleMessageDelivered)

    // Cleanup listeners on unmount
    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('userTyping', handleUserTyping)
      socket.off('messageRead', handleMessageRead)
      socket.off('messageDelivered', handleMessageDelivered)
    }
  }, [socket])

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations')
      setConversations(data)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }, [])

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.error('Invalid conversation ID:', conversationId)
      return
    }

    setLoading(true)
    try {
      const { data } = await api.get(`/messages/${conversationId}`)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (conversationId, content, messageType = 'text') => {
    try {
      const { data } = await api.post('/messages', {
        conversationId,
        content,
        messageType,
      })
      // Don't add message to state here - it will be added via socket 'newMessage' event
      // This prevents duplicate messages
      updateConversationLastMessage(data)
      return data
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }, [])

  const createConversation = useCallback(async (userId) => {
    try {
      const { data } = await api.post('/conversations', { userId })
      // Prevent duplicates - only add if conversation doesn't exist
      setConversations((prev) => {
        const exists = prev.some(conv => conv._id === data._id)
        if (exists) return prev
        return [data, ...prev]
      })
      return data
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast.error('Failed to create conversation')
      throw error
    }
  }, [])

  const updateConversationLastMessage = (message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        // Handle both populated conversation object and conversation ID
        const conversationId = typeof message.conversation === 'object'
          ? message.conversation._id
          : message.conversation;

        return conv._id === conversationId
          ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
          : conv;
      })
    )
  }

  const selectConversation = useCallback((conversation) => {
    if (!conversation) {
      // Leave current conversation if any
      if (socket && joinedConversationRef.current) {
        socket.emit('leaveConversation', joinedConversationRef.current)
        joinedConversationRef.current = null
      }
      setSelectedConversation(null)
      setMessages([])
      return
    }

    if (!conversation._id) {
      console.error('Conversation missing _id:', conversation)
      toast.error('Invalid conversation')
      return
    }

    // Don't rejoin if already in this conversation
    if (joinedConversationRef.current === conversation._id) {
      setSelectedConversation(conversation)
      return
    }

    setSelectedConversation(conversation)
    if (socket) {
      // Leave previous conversation if any
      if (joinedConversationRef.current) {
        socket.emit('leaveConversation', joinedConversationRef.current)
      }

      // Join new conversation
      socket.emit('joinConversation', conversation._id)
      joinedConversationRef.current = conversation._id
      fetchMessages(conversation._id)
    }
  }, [socket, fetchMessages])

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await api.delete(`/ conversations / ${conversationId} `)
      setConversations((prev) => prev.filter(conv => conv._id !== conversationId))
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
      toast.success('Conversation deleted successfully')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
      throw error
    }
  }, [selectedConversation])

  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', { conversationId, isTyping })
    }
  }, [socket])

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedConversation,
        messages,
        loading,
        typingUsers,
        fetchConversations,
        fetchMessages,
        sendMessage,
        createConversation,
        selectConversation,
        sendTypingIndicator,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
