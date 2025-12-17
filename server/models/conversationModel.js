import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for faster queries
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ participants: 1, isGroupChat: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ lastMessage: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;