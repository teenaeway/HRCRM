import { useEffect, useRef } from 'react';
import supabase from '../services/supabase';

/**
 * Custom hook to sync data in real-time from Supabase.
 * @param {string} tableName - The name of the table to listen to (e.g. 'Candidate', 'Client').
 * @param {Function} refetchCallback - The function to call when a change is detected.
 */
export default function useRealtimeSync(tableName, refetchCallback) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = refetchCallback;
  }, [refetchCallback]);

  useEffect(() => {
    if (!tableName) return;

    // Create a unique channel name based on the table
    const channelName = `realtime:${tableName}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log(`[Realtime] Change detected in ${tableName}:`, payload);
          // Call the latest refetch function
          if (savedCallback.current) {
            savedCallback.current();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to ${tableName}`);
        }
      });

    // Cleanup: unsubscribe from the channel when the component unmounts
    return () => {
      console.log(`[Realtime] Unsubscribing from ${tableName}`);
      supabase.removeChannel(channel);
    };
  }, [tableName]);
}
