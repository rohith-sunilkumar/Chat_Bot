import { useState, useRef } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import toast from 'react-hot-toast'

const MessageInput = () => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { selectedConversation, sendMessage, sendTypingIndicator } = useChat()
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleTyping = (e) => {
    setMessage(e.target.value)

    if (!isTyping) {
      setIsTyping(true)
      sendTypingIndicator(selectedConversation._id, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingIndicator(selectedConversation._id, false)
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!message.trim() || !selectedConversation) return

    try {
      await sendMessage(selectedConversation._id, message.trim())
      setMessage('')
      setIsTyping(false)
      sendTypingIndicator(selectedConversation._id, false)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Implement file upload
    toast.success('File upload feature coming soon!')
  }

  if (!selectedConversation) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 bg-black/20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleFileClick}
          className="p-2 rounded-xl transition-all hover:scale-110 hover:bg-white/10 opacity-60 hover:opacity-100"
        >
          <Smile className="h-5 w-5 text-white" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,application/pdf"
        />

        <div className="flex-1">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Type a message here..."
            className="w-full px-3 py-2 text-white placeholder-gray-400 bg-white/8 border border-white/10 rounded-xl focus:outline-none focus:bg-white/12 focus:border-white/20 text-sm transition-all"
          />
        </div>

        <button
          type="button"
          onClick={handleFileClick}
          className="p-2 rounded-xl transition-all hover:scale-110 hover:bg-white/10 opacity-60 hover:opacity-100"
        >
          <Paperclip className="h-5 w-5 text-white" />
        </button>

        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-xl transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${message.trim() ? 'bg-purple-500/30 hover:bg-purple-500/50' : 'bg-white/5 opacity-60'
            }`}
        >
          <Send className="h-5 w-5 text-white" />
        </button>
      </div>
    </form>
  )
}

export default MessageInput