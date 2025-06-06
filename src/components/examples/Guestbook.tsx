import React, { useEffect, useState } from 'react';
import { guestbookApi } from '../../utils/api';
import { GuestbookEntry } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Button } from '../ui/button';
import { Send, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const Guestbook: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await guestbookApi.getEntries();
      if (response.data.success) {
        setEntries(response.data.data);
      }
    } catch (err) {
      setError('Failed to load guestbook entries');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await guestbookApi.addEntry({
        name: name.trim(),
        message: message.trim()
      });

      if (response.data.success) {
        setName('');
        setMessage('');
        fetchEntries(); // Refresh entries
      } else {
        setError(response.data.error || 'Failed to add entry');
      }
    } catch (err) {
      setError('Failed to add entry');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Guestbook</h2>
      </div>

      <p className="text-muted-foreground mb-6">
        Leave a message for other visitors! Messages are stored in Redis using LPUSH.
      </p>

      {/* Add new entry form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            required
          />
        </div>
        <div>
          <Textarea
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !name.trim() || !message.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Adding...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Add Entry
            </>
          )}
        </Button>
      </form>

      {/* Entries list */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Recent Entries</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No entries yet. Be the first to leave a message!
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="p-4 bg-secondary rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-secondary-foreground">
                    {entry.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dayjs(entry.timestamp).format('MMM DD, HH:mm')}
                  </span>
                </div>
                <p className="text-secondary-foreground text-sm leading-relaxed">
                  {entry.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Guestbook;
