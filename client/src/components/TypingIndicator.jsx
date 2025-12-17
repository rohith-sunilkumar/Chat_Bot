import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { User, Mail, Lock, Bell, Moon, Sun, Save, Upload, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const SettingsView = () => {
  const { user, updateUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error('Username cannot be empty')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put('/users/profile', formData)
      updateUser({ ...user, ...data })
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const { data } = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      updateUser({ ...user, avatar: data.avatar })
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const copyUserId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id)
      setCopied(true)
      toast.success('User ID copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      toast.success('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  return (
    <div className="flex-1 glass-dark rounded-3xl m-4 p-6 overflow-y-auto">
      {/* Container with max width */}
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 text-sm">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="glass-dark p-6 rounded-2xl mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </h2>

          {/* Avatar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                alt={user?.username}
                className="h-20 w-20 rounded-full ring-4 ring-white/10"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="px-4 py-2 glass-dark hover:bg-purple-50 rounded-lg text-gray-900 text-sm transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Uploading...' : 'Change Avatar'}</span>
              </button>
              <p className="text-gray-600 text-xs mt-1">JPG, PNG or GIF. Max 2MB</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="glass-dark p-6 rounded-2xl mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Preferences
          </h2>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isDark ? <Moon className="h-5 w-5 text-gray-400" /> : <Sun className="h-5 w-5 text-gray-400" />}
                <div>
                  <p className="text-gray-900 text-sm font-medium">Dark Mode</p>
                  <p className="text-gray-600 text-xs">Toggle dark/light theme</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">Notifications</p>
                  <p className="text-gray-600 text-xs">Enable push notifications</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications(!notifications)
                  toast.success(notifications ? 'Notifications disabled' : 'Notifications enabled')
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-dark p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Security
          </h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-dark p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 glass-dark text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    }}
                    className="flex-1 py-2.5 glass-dark hover:bg-gray-100 rounded-xl text-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsView