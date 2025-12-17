import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Hash, Copy, Check, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ProfileView = () => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyUserId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id)
      setCopied(true)
      toast.success('User ID copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    try {
      return format(new Date(date), 'MMMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="flex-1 glass-dark rounded-3xl m-4 p-6 overflow-y-auto">
      {/* Container with max width */}
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600 text-sm">Manage your account information</p>
        </div>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {user?.avatar && user.avatar !== 'https://via.placeholder.com/150' ? (
              <img
                src={user.avatar}
                alt={user?.username}
                className="h-24 w-24 rounded-full ring-4 ring-purple-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-4 ring-purple-200">
                <span className="text-3xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 border-4 border-white rounded-full"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
          <p className="text-gray-600 text-sm">{user?.email}</p>
        </div>

        {/* User ID Card */}
        <div className="glass-dark p-6 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Hash className="h-5 w-5 mr-2" />
              Your Unique User ID
            </h2>
            <button
              onClick={copyUserId}
              className="p-2 glass-dark hover:bg-white/10 rounded-lg transition-colors"
              title="Copy User ID"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Copy className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          <div className="bg-black/30 p-4 rounded-xl">
            <p className="text-gray-900 font-mono text-sm break-all">{user?._id}</p>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            💡 Share this ID with others so they can find you and start a conversation
          </p>
        </div>

        {/* Profile Information */}
        <div className="glass-dark p-6 rounded-2xl mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </h2>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Username
              </label>
              <div className="glass-dark px-4 py-3 rounded-xl">
                <p className="text-gray-900">{user?.username}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Email Address
              </label>
              <div className="glass-dark px-4 py-3 rounded-xl flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Bio
              </label>
              <div className="glass-dark px-4 py-3 rounded-xl min-h-[80px]">
                <p className="text-gray-900">
                  {user?.bio || 'No bio added yet'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="glass-dark p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Account Details
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 text-sm">Member Since</span>
              </div>
              <span className="text-gray-900 text-sm">{formatDate(user?.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 text-sm">Account Status</span>
              </div>
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-700 text-sm">
            ℹ️ To edit your profile information, go to Settings from the sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileView