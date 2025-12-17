import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import cloudinary from '../config/cloudinary.js';

// [desc](cci:4://file://desc:0:0-0:0)    Get messages for a conversation
// [route](cci:4://file://route:0:0-0:0)   GET /api/messages/:conversationId
// [access](cci:4://file://access:0:0-0:0)  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Use lean() for better performance and parallel queries
    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    res.json({
      messages: messages.reverse(),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    console.log('Sending message:', { conversationId, content, messageType });

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate message (don't use lean here to maintain proper structure)
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('conversation');

    // Emit socket event to all participants
    const io = req.app.get('io');
    if (populatedMessage.conversation && populatedMessage.conversation.participants) {
      console.log('Emitting newMessage to participants:', populatedMessage.conversation.participants);
      
      // Emit to conversation room (for users currently viewing the conversation)
      io.to(conversationId).emit('newMessage', populatedMessage);
      
      // Also emit to each participant's personal room (for real-time updates)
      populatedMessage.conversation.participants.forEach((participantId) => {
        const participantIdStr = participantId.toString();
        console.log(`Emitting to user room: ${participantIdStr}`);
        io.to(participantIdStr).emit('newMessage', populatedMessage);
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload file/image
// @route   POST /api/messages/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    // Verify conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/messages',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Determine message type
    const messageType = result.resource_type === 'image' ? 'image' : 'file';

    // Create message with file
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      messageType,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      content: req.body.content || '',
    });

    // Update conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('conversation');

    // Emit socket event
    const io = req.app.get('io');
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(participantId.toString()).emit('newMessage', populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
      await message.save();

      // Emit socket event
      const io = req.app.get('io');
      io.to(message.sender.toString()).emit('messageRead', {
        messageId: message._id,
        userId: req.user._id,
      });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as delivered
// @route   PUT /api/messages/:id/delivered
// @access  Private
export const markAsDelivered = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already delivered to this user
    const alreadyDelivered = message.deliveredTo.some(
      (delivery) => delivery.user.toString() === req.user._id.toString()
    );

    if (!alreadyDelivered) {
      message.deliveredTo.push({ user: req.user._id, deliveredAt: new Date() });
      await message.save();

      // Emit socket event
      const io = req.app.get('io');
      io.to(message.sender.toString()).emit('messageDelivered', {
        messageId: message._id,
        userId: req.user._id,
      });
    }

    res.json({ message: 'Message marked as delivered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};