import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { noteService } from '../services/notes';
import { patientService } from '../services/patient';
import { authService } from '../services/auth';
import { Patient } from '../types/patient';
import { Note } from '../types/note';

const DoctorNotesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const user = authService.getUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const [patientData, notesData] = await Promise.all([
          patientService.getPatient(parseInt(id)),
          noteService.getPatientNotes(parseInt(id))
        ]);
        setPatient(patientData);
        setNotes(notesData);
      } catch (err) {
        setError('Failed to fetch patient data');
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const note = await noteService.addNote(parseInt(id), {
        title: newNote.title,
        content: newNote.content
      });
      setNotes(prev => [note, ...prev]);
      setNewNote({ title: '', content: '' });
      setSuccess(true);
    } catch (err) {
      setError('Failed to add note');
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Patient not found'}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-2 md:px-0">
      {/* Header and Patient Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Notes</h1>
          <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-lg text-gray-900">{patient.name}</div>
              <div className="text-gray-500 text-sm">{patient.email}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Add New Note</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-2 rounded">
                  Note added successfully!
                </div>
              )}
              <input
                type="text"
                placeholder="Title"
                value={newNote.title}
                onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                required
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <textarea
                placeholder="Content"
                rows={3}
                value={newNote.content}
                onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                required
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.length === 0 ? (
            <p className="text-gray-500">No notes available</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-600 font-semibold text-lg">{note.title}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">{note.content}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">By</span>
                  <span className="text-sm font-medium text-gray-800">Dr. {note.doctorName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorNotesPage; 