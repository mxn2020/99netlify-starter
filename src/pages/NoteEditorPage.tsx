import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { notesApi } from '../utils/api';
import { useAccount } from '../contexts/AccountContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Note } from '../types';
import { Save, ArrowLeft, Eye, EyeOff, Tag, Plus, X, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../utils/cn';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const NoteEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const isEditing = id && id !== 'new';

  const [note, setNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
  }, [id, isEditing, currentAccount]);

  const fetchNote = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      let response;
      if (currentAccount) {
        response = await notesApi.getNoteInAccount(currentAccount.id, id);
      } else {
        response = await notesApi.getNote(id);
      }
      setNote(response.data.note);
    } catch (error: any) {
      console.error('Error fetching note:', error);
      if (error.response?.status === 404) {
        setError('Note not found');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to edit this note');
      } else {
        setError('Failed to load note');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.title?.trim() || !note.content?.trim()) {
      alert('Please provide both a title and content for your note');
      return;
    }

    try {
      setSaving(true);

      const noteData = {
        title: note.title.trim(),
        content: note.content.trim(),
        category: note.category || 'general',
        tags: note.tags || [],
        isPublic: note.isPublic || false,
      };

      let response;
      if (isEditing && id) {
        if (currentAccount) {
          response = await notesApi.updateNoteInAccount(currentAccount.id, id, noteData);
        } else {
          response = await notesApi.updateNote(id, noteData);
        }
      } else {
        if (currentAccount) {
          response = await notesApi.createNoteInAccount(currentAccount.id, noteData);
        } else {
          response = await notesApi.createNote(noteData);
        }
      }

      navigate(`/notes/${response.data.note.id}`);
    } catch (error: any) {
      console.error('Error saving note:', error);
      alert(error.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !note.tags?.includes(newTag.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
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
          to={isEditing ? `/notes/${id}` : '/notes'}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEditing ? 'Back to Note' : 'Back to Notes'}
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Account Context */}
      {currentAccount && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {isEditing ? 'Editing note in' : 'Creating note in'} <strong>{currentAccount.name}</strong>
          </span>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Note Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Title */}
          <div>
            <Input
              type="text"
              placeholder="Note title..."
              value={note.title || ''}
              onChange={(e) => setNote(prev => ({ ...prev, title: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="text-2xl font-bold bg-transparent border-none outline-none"
            />
          </div>

          {/* Settings Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category:
              </Label>
              <Select value={note.category || 'general'} onValueChange={(value) => setNote(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="ideas">Ideas</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setNote(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  note.isPublic
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                )}
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
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags:
            </Label>

            {/* Existing Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {note.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <Button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </span>
              ))}
            </div>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="p-6">
          <Textarea
            placeholder="Start writing your note..."
            value={note.content || ''}
            onChange={(e) => setNote(prev => ({ ...prev, content: e.target.value }))}
            onKeyPress={handleKeyPress}
            className="w-full h-96 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 leading-relaxed"
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl + Enter</kbd> to save quickly</p>
      </div>
    </div>
  );
};

export default NoteEditorPage;
