import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { syncAPI } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

const SyncButton = ({ onSyncComplete }) => {
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await syncAPI.triggerSync();
      toast.success('Data sync completed successfully!');
      
      if (onSyncComplete) {
        onSyncComplete(response.data.data);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(error.response?.data?.message || 'Data sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={`
        inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
        ${syncing
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }
      `}
    >
      {syncing ? (
        <>
          <LoadingSpinner size="small" className="mr-2" />
          Syncing...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Sync Data
        </>
      )}
    </button>
  );
};

export default SyncButton;
