import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import Message from '../models/messageModel.js';

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt messageType',
        populate: { path: 'sender', select: 'username' },
      })
      .populate('admin', 'username avatar')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or get one-to-one conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if conversation already exists (allow existing conversations)
    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .lean();

    if (conversation) {
      return res.json(conversation);
    }

    // For new conversations, check if users are friends
    // TODO: Set REQUIRE_FRIENDSHIP=true in .env to enable friend requirement
    const requireFriendship = process.env.REQUIRE_FRIENDSHIP === 'true';
    
    if (requireFriendship) {
      const currentUser = await User.findById(req.user._id);
      if (!currentUser.friends.includes(userId)) {
        return res.status(403).json({ 
          message: 'You can only chat with friends. Send a friend request first.',
          requiresFriendship: true
        });
      }
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user._id, userId],
      isGroupChat: false,
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage');

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create group chat
// @route   POST /api/conversations/group
// @access  Private
export const createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({
        message: 'Group name and at least 2 participants are required',
      });
    }

    // Add creator to participants
    const allParticipants = [...new Set([req.user._id, ...participants])];

    const groupChat = await Conversation.create({
      name,
      isGroupChat: true,
      participants: allParticipants,
      admin: req.user._id,
    });

    const populatedGroup = await Conversation.findById(groupChat._id)
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('admin', 'username avatar');

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('admin', 'username avatar');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group chat
// @route   PUT /api/conversations/:id
// @access  Private
export const updateGroupChat = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat' });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group' });
    }

    conversation.name = req.body.name || conversation.name;
    conversation.groupAvatar = req.body.groupAvatar || conversation.groupAvatar;

    const updatedConversation = await conversation.save();

    const populated = await Conversation.findById(updatedConversation._id)
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('admin', 'username avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user to group
// @route   PUT /api/conversations/:id/add
// @access  Private
export const addToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add users' });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('admin', 'username avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove user from group
// @route   PUT /api/conversations/:id/remove
// @access  Private
export const removeFromGroup = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Only admin can remove users
    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove users' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );

    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate('participants', 'username avatar')
      .populate('admin', 'username avatar');

    res.json(updatedConversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant of this conversation' });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: id });

    // Delete the conversation
    await Conversation.findByIdAndDelete(id);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};