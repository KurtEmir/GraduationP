import { API_URL } from '../config';
import { Message, ChatPartner } from '../types/message';

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const messageService = {
  async getChatPartners(): Promise<ChatPartner[]> {
    // console.log('[Mock] Fetching chat partners...');
    // await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
    // // Simulate filtering partners based on role (e.g., patients see doctors/admins, doctors see patients/admins)
    // return [...mockChatPartners].filter(p => {
    //     if (CURRENT_USER_ROLE === 'PATIENT') return p.role === 'DOCTOR' || p.role === 'ADMIN';
    //     if (CURRENT_USER_ROLE === 'DOCTOR') return p.role === 'PATIENT' || p.role === 'ADMIN';
    //     // Admins can see everyone (or other logic)
    //     return true;
    // }).map(p => ({...p, unreadCount: mockMessages[p.id]?.filter(m => m.receiverId === CURRENT_USER_ID && !m.isRead).length || 0 }));
    const response = await fetch(`${API_URL}/messaging/partners`, { // Assuming endpoint
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch chat partners');
    return response.json();
  },

  async getMessages(partnerId: number): Promise<Message[]> {
    // console.log(`[Mock] Fetching messages for partner ID: ${partnerId}`);
    // await new Promise(resolve => setTimeout(resolve, 400));
    
    // if (mockMessages[partnerId]) {
    //   mockMessages[partnerId].forEach(msg => {
    //     if (msg.receiverId === CURRENT_USER_ID && msg.senderId === partnerId) {
    //       msg.isRead = true;
    //     }
    //   });
    //   const partner = mockChatPartners.find(p => p.id === partnerId);
    //   if (partner) {
    //     partner.unreadCount = 0; 
    //   }
    // }
    // return mockMessages[partnerId] ? [...mockMessages[partnerId]] : [];
    const response = await fetch(`${API_URL}/messaging/messages/${partnerId}`, { // Assuming endpoint
        headers: getAuthHeader()
    });
    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // If response is not JSON, use text
        try {
            errorBody = await response.text();
        } catch (e_text) {
            // If cannot get text body either
            errorBody = "Could not parse error response body.";
        }
      }
      console.error(`Failed to fetch messages for partner ${partnerId}. Status: ${response.status}`, errorBody);
      throw new Error(`Failed to fetch messages for partner ${partnerId}`);
    }
    const data = await response.json();
    console.log(`Raw messages for partner ${partnerId}:`, JSON.stringify(data, null, 2));
    
    // Map the API response to our Message interface
    return data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      timestamp: msg.timestamp,
      isRead: msg.is_read,
      senderRole: msg.sender_role,
      receiverRole: msg.receiver_role
    }));
  },

  async sendMessage(receiverId: number, content: string): Promise<Message> {
    const requestBody = { receiver_id: receiverId, content };
    console.log('Sending message with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_URL}/messaging/messages`, { // Assuming endpoint
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        try {
            errorBody = await response.text();
        } catch (e_text) {
            errorBody = "Could not parse error response body for send message.";
        }
      }
      console.error(`Failed to send message. Status: ${response.status}`);
      if (typeof errorBody === 'object' && errorBody !== null) {
        console.error("Error body for send message (JSON):", JSON.stringify(errorBody, null, 2));
      } else {
        console.error("Error body for send message (text):", errorBody);
      }
      throw new Error('Failed to send message');
    }
    const msg = await response.json();
    
    // Map the API response to our Message interface
    return {
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      timestamp: msg.timestamp,
      isRead: msg.is_read,
      senderRole: msg.sender_role,
      receiverRole: msg.receiver_role
    };
  },

  async markMessageAsRead(messageId: string | number): Promise<void> {
    // console.log(`[Mock] Marking message ID ${messageId} as read.`);
    // await new Promise(resolve => setTimeout(resolve, 100));
    // for (const partnerId in mockMessages) {
    //     const msg = mockMessages[partnerId].find(m => m.id === messageId);
    //     if (msg && msg.receiverId === CURRENT_USER_ID) {
    //         msg.isRead = true;
    //         // Also update unread count for the partner if this was the last unread message
    //         const partner = mockChatPartners.find(p => p.id === msg.senderId);
    //         if (partner) {
    //             const unread = mockMessages[msg.senderId]?.filter(m => m.receiverId === CURRENT_USER_ID && !m.isRead).length || 0;
    //             partner.unreadCount = unread;
    //         }
    //         break;
    //     }
    // }
    // return;
    const response = await fetch(`${API_URL}/messaging/messages/${messageId}/read`, { // Assuming endpoint
        method: 'PATCH', // Or PUT
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to mark message as read');
    // Backend might return success status or updated message, handle as needed
    // For void, we might not expect a body or just a success status.
  },
}; 