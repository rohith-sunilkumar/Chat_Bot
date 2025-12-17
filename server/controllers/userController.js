import User from '../models/userModel.js';
import mongoose from 'mongoose';

// @desc    Search user by ID or email (exact match)
// @route   GET /api/users/search
// @access  Private
export const searchUserByIdOrEmail = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Check if query is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);

    // Build search criteria
    const searchCriteria = {
      _id: { $ne: req.user._id } // Exclude current user
    };

    // If it's a valid ObjectId, search by ID, otherwise search by email
    if (isValidObjectId) {
      searchCriteria.$or = [
        { _id: query },
        { email: query.toLowerCase() }
      ];
    } else {
      // Only search by email if not a valid ObjectId
      searchCriteria.email = query.toLowerCase();
    }

    const user = await User.findOne(searchCriteria).select('-password');

    if (!user) {
      return res.json([]);
    }

    res.json([user]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for contacts list - only friends)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('friends', '-password');
    res.json(currentUser.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio || user.bio;

      if (req.body.avatar) {
        user.avatar = req.body.avatar;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to Base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Validate file size (limit to 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    const user = await User.findById(req.user._id);
    user.avatar = base64Image;
    await user.save();

    res.json({ avatar: base64Image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send friend request
// @route   POST /api/users/friend-request/:userId
// @access  Private
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if already friends
    if (currentUser.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if request already sent
    if (currentUser.friendRequestsSent.includes(userId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if received request from this user
    if (currentUser.friendRequestsReceived.includes(userId)) {
      return res.status(400).json({ message: 'This user has already sent you a request. Accept it instead.' });
    }

    // Add to friend requests
    currentUser.friendRequestsSent.push(userId);
    targetUser.friendRequestsReceived.push(req.user._id);

    await currentUser.save();
    await targetUser.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('friendRequestReceived', {
        from: {
          _id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar
        }
      });
    }

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   POST /api/users/friend-request/accept/:userId
// @access  Private
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    const senderUser = await User.findById(userId);

    if (!senderUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request exists
    if (!currentUser.friendRequestsReceived.includes(userId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add to friends
    currentUser.friends.push(userId);
    senderUser.friends.push(req.user._id);

    // Remove from requests
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => id.toString() !== userId
    );
    senderUser.friendRequestsSent = senderUser.friendRequestsSent.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await senderUser.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('friendRequestAccepted', {
        user: {
          _id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar
        }
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject friend request
// @route   POST /api/users/friend-request/reject/:userId
// @access  Private
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    const senderUser = await User.findById(userId);

    if (!senderUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from requests
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => id.toString() !== userId
    );
    senderUser.friendRequestsSent = senderUser.friendRequestsSent.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await senderUser.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friend requests
// @route   GET /api/users/friend-requests
// @access  Private
export const getFriendRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('friendRequestsReceived', '-password')
      .populate('friendRequestsSent', '-password');

    res.json({
      received: currentUser.friendRequestsReceived,
      sent: currentUser.friendRequestsSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};