export type { UserRole } from './auth'; // Re-export UserRole to make it available
import { UserRole as LocalUserRole } from './auth'; // Import for local use

export interface Message {
  id: string; // Or number, depending on backend
  senderId: number;
  receiverId: number;
  senderRole?: LocalUserRole; // Optional: useful for UI differentiation
  receiverRole?: LocalUserRole; // Optional
  content: string;
  timestamp: string; // ISO date string
  isRead: boolean;
}

// Represents a user with whom the current user can chat
export interface ChatPartner {
  id: number; // User ID of the chat partner
  name: string;
  role: LocalUserRole;
  lastMessage?: string; // Optional: for conversation list preview
  lastMessageTimestamp?: string; // Optional
  unreadCount?: number; // Optional
  profilePictureUrl?: string; // Added for profile pictures
}

// Represents a full conversation with a partner
export interface Conversation {
  partner: ChatPartner;
  messages: Message[];
} 