import { API_URL } from '../config';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export const messageService = {
  async getMessages(patientId: number): Promise<Message[]> {
    const response = await fetch(`${API_URL}/messages/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async getDoctorMessages(): Promise<Message[]> {
    const response = await fetch(`${API_URL}/messages/doctor`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendMessage(receiverId: number, content: string): Promise<Message> {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ receiverId, content })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async markAsRead(messageId: number): Promise<void> {
    const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to mark message as read');
  }
}; 