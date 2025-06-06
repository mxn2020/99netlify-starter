import React, { useEffect, useState } from 'react';
import { counterApi } from '../../utils/api';
import { CounterData } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Button } from '../ui/button';
import { Plus, RotateCcw, Hash } from 'lucide-react';

const RedisCounter: React.FC = () => {
  const [counterData, setCounterData] = useState<CounterData>({ count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounter = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await counterApi.getCounter();
      if (response.data.success) {
        setCounterData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to load counter');
      }
    } catch (err) {
      setError('Failed to load counter');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounter();
  }, []);

  const incrementCounter = async () => {
    try {
      setIsIncrementing(true);
      setError(null);
      const response = await counterApi.increment();
      if (response.data.success) {
        setCounterData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to increment counter');
      }
    } catch (err) {
      setError('Failed to increment counter');
      console.error(err);
    } finally {
      setIsIncrementing(false);
    }
  };

  const resetCounter = async () => {
    try {
      setError(null);
      const response = await counterApi.reset();
      if (response.data.success) {
        setCounterData({ count: 0 });
      } else {
        setError(response.data.error || 'Failed to reset counter');
      }
    } catch (err) {
      setError('Failed to reset counter');
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Hash className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Redis Counter</h2>
      </div>

      <p className="text-muted-foreground mb-6">
        A simple counter using Redis INCR command. Demonstrates atomic operations and persistence.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div className="text-center">
          {/* Counter Display */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-primary mb-2 font-mono">
              {counterData.count.toLocaleString()}
            </div>
            <p className="text-muted-foreground">
              Current count stored in Redis
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={incrementCounter}
              disabled={isIncrementing}
              className="flex-1 max-w-xs"
            >
              {isIncrementing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Incrementing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Increment
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={resetCounter}
              disabled={isIncrementing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Technical details */}
          <div className="mt-8 p-4 bg-secondary rounded-lg text-left">
            <h3 className="font-medium text-secondary-foreground mb-2">How it works:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Uses Redis <code className="bg-background px-1 rounded">INCR</code> command for atomic increment</li>
              <li>• Data persists across sessions and deployments</li>
              <li>• Shared counter across all users</li>
              <li>• Reset uses <code className="bg-background px-1 rounded">DEL</code> command</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedisCounter;
