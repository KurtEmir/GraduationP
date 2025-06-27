import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/messageService';
import { ChatPartner, Message } from '../types/message';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Helper function to format timestamp for chat list
const formatChatListTimestamp = (isoTimestamp?: string): string => {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yyyy', { locale: enUS });
};

// Helper to get initials for profile picture placeholder
const getInitials = (name: string): string => {
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const query = useQuery();
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadChatPartners = useCallback(async () => {
    if (!user) return;
    setLoadingPartners(true);
    setError(null);
    try {
      let partners = await messageService.getChatPartners();
      // Sort partners by last message timestamp, newest first
      partners = partners.sort((a, b) => {
        if (!a.lastMessageTimestamp) return 1;
        if (!b.lastMessageTimestamp) return -1;
        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
      });
      setChatPartners(partners);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load chat partners';
      setError(errorMsg);
      console.error("Error loading chat partners:", err);
    } finally {
      setLoadingPartners(false);
    }
  }, [user]);

  useEffect(() => {
    loadChatPartners();
  }, [loadChatPartners]);

  // Effect to select a partner from URL query param
  useEffect(() => {
    const partnerIdFromUrl = query.get('partnerId');
    if (partnerIdFromUrl && chatPartners.length > 0 && !selectedPartner) {
      const partnerToSelect = chatPartners.find(p => p.id === parseInt(partnerIdFromUrl, 10));
      if (partnerToSelect) {
        setSelectedPartner(partnerToSelect);
      }
    }
  }, [chatPartners, query, selectedPartner]);

  const loadMessages = useCallback(async (partnerId: number) => {
    setLoadingMessages(true);
    // Don't clear error here if it's a send error, only for load errors
    // setError(null); 
    try {
      const fetchedMessages = await messageService.getMessages(partnerId);
      setMessages(fetchedMessages);
      // After fetching messages, reload partners to update unread counts and last message
      await loadChatPartners();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMsg); // Set error for message loading
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadChatPartners]); // Added loadChatPartners to dependency to refresh list

  useEffect(() => {
    if (selectedPartner) {
      setMessages([]);
      setError(null); // Clear previous errors when selecting a new partner
      loadMessages(selectedPartner.id);
      
      const intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
           loadMessages(selectedPartner.id);
        }
      }, 15000); 

      return () => clearInterval(intervalId);
    } else {
      setMessages([]);
    }
  }, [selectedPartner, loadMessages]);


  const handleSelectPartner = (partner: ChatPartner) => {
    if (selectedPartner?.id === partner.id) return; // Don't re-select same partner
    setSelectedPartner(partner);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner || !user) return;
    const tempMessageId = `temp-${Date.now()}`; // Temporary ID for optimistic update

    // Optimistic update for the new message
    const optimisticMessage: Message = {
        id: tempMessageId,
        senderId: user.id,
        receiverId: selectedPartner.id,
        senderRole: user.role,
        receiverRole: selectedPartner.role,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    const currentMessageText = newMessage;
    setNewMessage('');

    try {
      const sentMessage = await messageService.sendMessage(selectedPartner.id, currentMessageText);
      // Replace optimistic message with actual message from server (if different ID or data)
      setMessages(prevMessages => prevMessages.map(m => m.id === tempMessageId ? sentMessage : m));
      // Reload chat partners to update last message & unread count
      await loadChatPartners();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg); // Show send error
      console.error("Error sending message:",err);
      // Revert optimistic update on error
      setMessages(prevMessages => prevMessages.filter(m => m.id !== tempMessageId));
      setNewMessage(currentMessageText); // Put message back in input
    }
  };

  if (!user) {
    return <div className="p-6 text-center text-gray-600">Authenticating... Please wait.</div>;
  }
  
  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] bg-gray-100 dark:bg-gray-900"> {/* Use CSS var for header height */}
      {/* Sidebar - Chat Partners List */}
      <div className="w-80 border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Chats</h2>
          {/* TODO: Add search/filter for partners */}
        </div>
        {loadingPartners && <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Loading contacts...</div>}
        {error && !loadingPartners && chatPartners.length === 0 && <div className="p-4 text-sm text-red-500 text-center">{error}</div>}
        {!loadingPartners && chatPartners.length === 0 && !error && <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No contacts available.</div>}
        
        <ul className="overflow-y-auto flex-grow">
          {chatPartners.map(partner => (
            <li
              key={partner.id}
              className={`p-3 flex items-center space-x-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${selectedPartner?.id === partner.id ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500' : 'border-transparent'}`}
              onClick={() => handleSelectPartner(partner)}
            >
              <div className="relative">
                {partner.profilePictureUrl ? (
                  <img src={partner.profilePictureUrl} alt={partner.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(partner.name)}
                  </div>
                )}
                {partner.unreadCount && partner.unreadCount > 0 && (
                   <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                     {partner.unreadCount}
                   </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{partner.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatChatListTimestamp(partner.lastMessageTimestamp)}</p>
                </div>
                <p className={`text-sm ${partner.unreadCount && partner.unreadCount > 0 ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'} truncate`}>
                  {partner.lastMessage || 'No messages yet.'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {selectedPartner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center space-x-3">
               {selectedPartner.profilePictureUrl ? (
                  <img src={selectedPartner.profilePictureUrl} alt={selectedPartner.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(selectedPartner.name)}
                  </div>
                )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedPartner.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPartner.role?.toLowerCase()}</p>
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-100 dark:bg-gray-900">
              {loadingMessages && <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">Loading messages...</div>}
              {error && messages.length === 0 && <div className="text-center text-sm text-red-500 py-4">{error}</div>}
              {!loadingMessages && messages.length === 0 && !error && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="mt-2 text-sm font-medium">No messages yet.</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              )}
              
              {messages.map(msg => {
                const isCurrentUserSender = msg.senderId === user.id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-sm md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl
                      ${isCurrentUserSender
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                      }
                    `}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isCurrentUserSender ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'} text-right`}>
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <div className="p-3 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loadingMessages}
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 transition duration-150 ease-in-out"
                  disabled={!newMessage.trim() || loadingMessages}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M3.105 3.105a1.5 1.5 0 012.122-.001L19.43 14.29a1.513 1.513 0 01-1.188 2.554H10.5a1.5 1.5 0 00-1.5 1.5v.553a1.512 1.512 0 01-2.429 1.038L3.105 3.105zM4.43 15.71a1.513 1.513 0 01-1.188-2.554L14.57 2.866a1.5 1.5 0 012.121.001l2.304 2.304a1.512 1.512 0 01-1.038 2.429h-.553a1.5 1.5 0 00-1.5 1.5v7.071a1.513 1.513 0 01-2.554 1.188L4.43 15.71z" />
                  </svg>
                </button>
              </form>
              {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>} {/* Display error below input */}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-3 text-lg font-medium">Select a chat to start messaging</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Your conversations will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage; 