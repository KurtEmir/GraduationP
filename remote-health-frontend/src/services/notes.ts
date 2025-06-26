import { API_URL } from '../config';
import { Note } from '../types/note';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const noteService = {
  async getPatientNotes(patientId: number): Promise<Note[]> {
    const response = await fetch(`${API_URL}/notes/${patientId}`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  },

  async addNote(patientId: number, data: { title: string; content: string }): Promise<Note> {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        patientId,
        type: 'GENERAL',
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error('Failed to add note');
    return response.json();
  },

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update note');
    return response.json();
  },

  async deleteNote(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete note');
  },
}; 