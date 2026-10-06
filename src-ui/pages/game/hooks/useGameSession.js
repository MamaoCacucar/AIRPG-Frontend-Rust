import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  getGenerationStatus,
  isGenerationErrorMessage,
} from '/src-ui/shared/utils/generationStatus';

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

export function useGameSession(campaignId, initialGeneration = null) {
  const initialStartedAt = initialGeneration?.generationStartedAt ?? null;
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interactionError, setInteractionError] = useState(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(Boolean(initialStartedAt));
  const [generationStatus, setGenerationStatus] = useState(() => initialStartedAt
    ? {
      phase: 'generating',
      stage: 'narrative',
      message: initialGeneration.generationStatus || 'Gerando a narrativa...',
      startedAt: initialStartedAt,
    }
    : null);
  const currentStageRef = useRef('narrative');
  const generationStartedAtRef = useRef(initialStartedAt);
  const hasReceivedImageRef = useRef(false);
  const generationCompleteRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    let hasLoadedSession = false;
    let unlisten;
    const queuedEvents = [];
    const imageUrls = new Set();
    let hasNarrative = false;

    async function loadSession() {
      setIsLoading(true);
      setError(null);
      setInteractionError(null);
      setSession(null);
      setIsWaitingForResponse(Boolean(initialStartedAt));

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
          hasNarrative = sessionData.history.some((item) => item.type === 'narrative');
          const updatedSession = queuedEvents.reduce((currentSession, event) => {
            const sessionEvent = toSessionEvent(event, currentSession);
            handleEventStatus(event);
            return appendSessionEvent(currentSession, sessionEvent);
          }, sessionData);
          hasNarrative = updatedSession.history.some((item) => item.type === 'narrative');
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
      const sessionEvent = toSessionEvent(event, {
        history: hasNarrative ? [{ type: 'narrative' }] : [],
      });
      handleEventStatus(event);
      if (!sessionEvent) {
        return;
      }
      if (sessionEvent.item.type === 'narrative') {
        hasNarrative = true;
      }
      setSession((currentSession) => appendSessionEvent(currentSession, sessionEvent));
    }

    function toSessionEvent(event, currentSession) {
      if (!event?.type) return null;
      const eventId = event.payload?.eventId ?? `${Date.now()}-${Math.random()}`;
      if (event.type === 'narrative') {
        const text = event.payload?.text;
        if (typeof text !== 'string' || !text.trim()) {
          return null;
        }
        return {
          roundIncrement: currentSession?.history?.some((item) => item.type === 'narrative') ? 1 : 0,
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
      if (event?.type === 'log') {
        if (generationCompleteRef.current) {
          return;
        }
        const update = getGenerationStatus(event.payload, currentStageRef.current);
        if (!update) {
          return;
        }
        if (update.phase === 'error') {
          generationCompleteRef.current = true;
          setGenerationStatus(update);
          setInteractionError(update.message);
          setIsWaitingForResponse(false);
          return;
        }
        currentStageRef.current = update.stage;
        generationStartedAtRef.current ??= Date.now();
        if (update.isRoundComplete && hasReceivedImageRef.current) {
          generationCompleteRef.current = true;
          const elapsedMs = generationStartedAtRef.current
            ? Date.now() - generationStartedAtRef.current
            : null;
          setGenerationStatus({
            phase: 'complete',
            stage: 'complete',
            message: 'Rodada gerada.',
            startedAt: generationStartedAtRef.current,
            elapsedMs,
          });
          setIsWaitingForResponse(false);
          return;
        }
        setGenerationStatus({
          phase: 'generating',
          ...update,
          startedAt: generationStartedAtRef.current,
        });
        return;
      }

      if (event?.type === 'narrative') {
        generationStartedAtRef.current ??= Date.now();
        if (currentStageRef.current === 'narrative') {
          setGenerationStatus({
            phase: 'generating',
            stage: 'analysis',
            message: 'Narrativa pronta. Preparando a análise da rodada...',
            startedAt: generationStartedAtRef.current,
          });
          currentStageRef.current = 'analysis';
        }
      } else if (
        event?.type === 'image'
        && Array.isArray(event.payload?.bytes)
        && typeof event.payload?.contentType === 'string'
      ) {
        hasReceivedImageRef.current = true;
        setGenerationStatus({
          phase: 'generating',
          stage: 'image',
          message: 'Imagem pronta. Finalizando a geração da rodada...',
          startedAt: generationStartedAtRef.current,
        });
      } else if (
        event?.type === 'system_message'
        && isGenerationErrorMessage(event.payload?.text)
      ) {
        generationCompleteRef.current = true;
        setIsWaitingForResponse(false);
        setInteractionError(event.payload.text);
        setGenerationStatus({
          phase: 'error',
          stage: 'error',
          message: event.payload.text.startsWith('ERRO')
            ? 'Não foi possível concluir a geração da rodada.'
            : event.payload.text,
        });
      }
    }

    function appendSessionEvent(currentSession, sessionEvent) {
      if (!currentSession || !sessionEvent) {
        return currentSession;
      }
      if (currentSession.history.some((item) => item.id === sessionEvent.item.id)) {
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
    const startedAt = Date.now();
    currentStageRef.current = 'narrative';
    generationStartedAtRef.current = startedAt;
    hasReceivedImageRef.current = false;
    generationCompleteRef.current = false;
    setGenerationStatus({
      phase: 'generating',
      stage: 'narrative',
      message: 'Enviando sua ação ao motor de IA...',
      startedAt,
    });
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
      generationCompleteRef.current = true;
      setGenerationStatus({
        phase: 'error',
        stage: 'error',
        message: `Não foi possível enviar sua ação: ${String(sendError)}`,
      });
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
    generationStatus,
    sendPlayerInput,
  };
}