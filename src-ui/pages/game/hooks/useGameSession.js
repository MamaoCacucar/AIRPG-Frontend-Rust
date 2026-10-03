import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * @typedef {Object} HistoryItem
 * @property {number|string} id
 * @property {'image' | 'narrative' | 'user'} type
 * @property {string} [text]
 * @property {string} [imageUrl]
 * @property {string} [metadata]
 *
 * @typedef {Object} GameSessionData
 * @property {string} campaignTitle
 * @property {number} roundNumber
 * @property {HistoryItem[]} history
 */

export function useGameSession(campaignId) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      setIsLoading(true);
      setError(null);
      setSession(null);

      if (!campaignId) {
        setError('ID da campanha não informado.');
        setIsLoading(false);
        return;
      }

      try {
        const sessionData = await invoke('load_game_session', { id: campaignId });
        if (isActive) setSession(sessionData);
      } catch (error) {
        console.error(`Erro ao carregar sessão ${campaignId}:`, error);
        if (isActive) setError(String(error));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadSession();

    return () => {
      isActive = false;
    };
  }, [campaignId]);

  return { session, isLoading, error };
}