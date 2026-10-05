import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

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
  const [interactionError, setInteractionError] = useState(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  useEffect(() => {
    let isActive = true;
    let hasLoadedSession = false;
    let unlisten;
    const queuedEvents = [];
    const imageUrls = new Set();

    async function loadSession() {
      setIsLoading(true);
      setError(null);
      setInteractionError(null);
      setSession(null);
      setIsWaitingForResponse(false);

      if (!campaignId) {
        setError('ID da campanha não informado.');
        setIsLoading(false);
        return;
      }

      try {
        const stopListening = await listen('sidecar-event', ({ payload }) => {
          if (!isActive) {
            return;
          }
          if (!hasLoadedSession) {
            queuedEvents.push(payload);
            return;
          }
          applySidecarEvent(payload);
        });
        if (!isActive) {
          stopListening();
          return;
        }
        unlisten = stopListening;

        const sessionData = await invoke('load_game_session', { id: campaignId });
        if (isActive) {
          hasLoadedSession = true;
          const updatedSession = queuedEvents.reduce((currentSession, event) => {
            const sessionEvent = toSessionEvent(event);
            handleEventStatus(event);
            return appendSessionEvent(currentSession, sessionEvent);
          }, sessionData);
          setSession(updatedSession);
          queuedEvents.length = 0;
        }
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
      unlisten?.();
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };

    function applySidecarEvent(event) {
      const sessionEvent = toSessionEvent(event);
      handleEventStatus(event);
      if (!sessionEvent) {
        return;
      }
      setSession((currentSession) => appendSessionEvent(currentSession, sessionEvent));
    }

    function toSessionEvent(event) {
      if (!event?.type) return null;
      const eventId = `${Date.now()}-${Math.random()}`;
      if (event.type === 'narrative') {
        const text = event.payload?.text;
        if (typeof text !== 'string' || !text.trim()) {
          return null;
        }
        return {
          roundIncrement: 1,
          item: {
            id: eventId,
            type: 'narrative',
            text,
            metadata: event.payload.speaker,
          },
        };
      }

      if (event.type === 'image') {
        const { bytes, contentType } = event.payload || {};
        if (!Array.isArray(bytes) || typeof contentType !== 'string') {
          return null;
        }
        const imageUrl = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: contentType })
        );
        imageUrls.add(imageUrl);
        return {
          roundIncrement: 0,
          item: { id: eventId, type: 'image', imageUrl },
        };
      }

      if (event.type === 'system_message' && typeof event.payload?.text === 'string') {
        return {
          roundIncrement: 0,
          item: {
            id: eventId,
            type: 'system',
            text: event.payload.text,
          },
        };
      }

      return null;
    }

    function handleEventStatus(event) {
      if (event?.type === 'narrative') {
        setIsWaitingForResponse(false);
      } else if (
        event?.type === 'system_message'
        && typeof event.payload?.text === 'string'
        && event.payload.text.startsWith('ERRO')
      ) {
        setIsWaitingForResponse(false);
        setInteractionError(event.payload.text);
      }
    }

    function appendSessionEvent(currentSession, sessionEvent) {
      if (!currentSession || !sessionEvent) {
        return currentSession;
      }
      return {
        ...currentSession,
        roundNumber: currentSession.roundNumber + sessionEvent.roundIncrement,
        history: [...currentSession.history, sessionEvent.item],
      };
    }
  }, [campaignId]);

  const sendPlayerInput = async (input) => {
    const message = input.trim();
    if (!message || isWaitingForResponse) {
      return false;
    }

    const messageId = `user-${Date.now()}-${Math.random()}`;
    setIsWaitingForResponse(true);
    setInteractionError(null);
    setSession((currentSession) => currentSession && ({
      ...currentSession,
      history: [...currentSession.history, {
        id: messageId,
        type: 'user',
        text: message,
      }],
    }));

    try {
      await invoke('send_player_input', { input: message });
      return true;
    } catch (sendError) {
      console.error('Erro ao enviar ação ao backend:', sendError);
      setSession((currentSession) => currentSession && ({
        ...currentSession,
        history: currentSession.history.filter((item) => item.id !== messageId),
      }));
      setIsWaitingForResponse(false);
      setInteractionError(String(sendError));
      return false;
    }
  };

  return {
    session,
    setSession,
    isLoading,
    error,
    interactionError,
    isWaitingForResponse,
    sendPlayerInput,
  };
}