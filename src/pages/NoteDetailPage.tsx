import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { notesApi } from '../utils/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Note } from '../types';
import { Edit, Trash2, Calendar, Tag, ArrowLeft, Share, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    if (!id) {
      setError('No note ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await notesApi.getNote(id);
      setNote(response.data.note);
    } catch (error: any) {
      console.error('Error fetching note:', error);
      if (error.response?.status === 404) {
        setError('Note not found');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view this note');
      } else {
        setError('Failed to load note');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    try {
      setDeleting(true);
      await notesApi.deleteNote(note.id);
      navigate('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const togglePublic = async () => {
    if (!note) return;

    try {
      const response = await notesApi.updateNote(note.id, {
        isPublic: !note.isPublic
      });
      setNote(response.data.note);
    } catch (error) {
      console.error('Error updating note visibility:', error);
      alert('Failed to update note visibility');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shareNote = () => {
    if (note && note.isPublic) {
      navigator.clipboard.writeText(`${window.location.origin}/notes/${note.id}/public`);
      alert('Public link copied to clipboard!');
    } else {
      alert('Note must be public to share');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error || 'Note not found'}</div>
        <Link to="/notes">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/notes" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Visibility Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={togglePublic}
            className="inline-flex items-center gap-2"
          >
            {note.isPublic ? (
              <>
                <Eye className="w-4 h-4" />
                Public
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Private
              </>
            )}
          </Button>

          {/* Share Button */}
          {note.isPublic && (
            <Button
              variant="outline"
              size="sm"
              onClick={shareNote}
              className="inline-flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          )}

          {/* Edit Button */}
          <Link to={`/notes/${note.id}/edit`}>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Note Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Note Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {note.title}
          </h1>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(note.createdAt)}</span>
            </div>
            
            {note.updatedAt !== note.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Updated {formatDate(note.updatedAt)}</span>
              </div>
            )}

            {note.category && (
              <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {note.category}
              </span>
            )}

            {note.isPublic && (
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Public
              </span>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Note Content */}
        <div className="p-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
              {note.content}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Note
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <>
                    <LoadingSpinner />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteDetailPage;
