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

  useEffect(() => {
    async function loadSession() {
      if (!campaignId) return;
      
      try {
        // Rust intercepta a chamada, inicializa contexto e devolve o histórico
        const sessionData = await invoke('load_game_session', { id: campaignId });
        setSession(sessionData);
      } catch (error) {
        console.error(`Erro ao carregar sessão ${campaignId}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [campaignId]);

  return { session, isLoading };
}