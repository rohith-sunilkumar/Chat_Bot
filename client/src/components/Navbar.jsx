import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { MessageCircle, Users, Clock } from 'lucide-react'

const HomeView = () => {
  const { user } = useAuth()
  const { conversations } = useChat()

  const stats = [
    {
      icon: MessageCircle,
      label: 'Total Conversations',
      value: conversations.length,
      color: 'text-blue-400'
    },
    {
      icon: Users,
      label: 'Contacts',
      value: conversations.filter(c => !c.isGroupChat).length,
      color: 'text-green-400'
    },
    {
      icon: MessageCircle,
      label: 'Group Chats',
      value: conversations.filter(c => c.isGroupChat).length,
      color: 'text-purple-400'
    }
  ]

  return (
    <div className="flex-1 glass-dark rounded-3xl m-4 p-8 overflow-y-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-gray-400">Here's what's happening with your conversations today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="glass-dark p-6 rounded-2xl hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="glass-dark p-6 rounded-2xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recent Activity
        </h2>
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent activity. Start a conversation!</p>
        ) : (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => {
              const otherUser = conv.isGroupChat 
                ? null 
                : conv.participants.find(p => p._id !== user._id)
              const name = conv.isGroupChat ? conv.name : otherUser?.username || 'Unknown'
              
              return (
                <div key={conv._id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                  <img
                    src={conv.isGroupChat 
                      ? (conv.groupAvatar || 'https://ui-avatars.com/api/?name=Group&background=random')
                      : (otherUser?.avatar || `https://ui-avatars.com/api/?name=${name}&background=random`)
                    }
                    alt={name}
                    className="h-10 w-10 rounded-full ring-2 ring-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{name}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeView