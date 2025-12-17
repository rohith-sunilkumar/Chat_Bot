import { useAuth } from '../context/AuthContext'
import { Check, CheckCheck } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

const Message = ({ message }) => {
  const { user } = useAuth()
  
  // Safety checks
  if (!message || !message.sender || !user) {
    console.error('Invalid message data:', message)
    return null
  }
  
  const isOwnMessage = message.sender._id === user._id
  
  // Debug: Log message to check structure
  if (!message.content) {
    console.log('Message without content:', message)
  }

  const formatMessageTime = (date) => {
    const messageDate = new Date(date)
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`
    } else {
      return format(messageDate, 'MMM dd, HH:mm')
    }
  }

  const getMessageStatus = () => {
    if (message.readBy && message.readBy.length > 0) {
      return (
        <CheckCheck className="h-4 w-4 text-blue-500" />
      )
    } else if (message.deliveredTo && message.deliveredTo.length > 0) {
      return (
        <CheckCheck className="h-4 w-4 text-gray-400" />
      )
    } else {
      return (
        <Check className="h-4 w-4 text-gray-400" />
      )
    }
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 ${isOwnMessage ? 'message-right' : 'message-left'}`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
        {/* Avatar - hidden for own messages */}
        {!isOwnMessage && (
          <img
            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}&background=random`}
            alt={message.sender.username}
            className="h-7 w-7 rounded-full flex-shrink-0 ring-2 ring-white/10"
          />
        )}

        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Message bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isOwnMessage
                ? 'message-bubble-sent text-white rounded-br-md'
                : 'message-bubble-received text-white rounded-bl-md'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {/* Timestamp and status */}
          <div className={`flex items-center space-x-1 mt-1 px-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs text-gray-400">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <span className="flex items-center">
                {getMessageStatus()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message