import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  getGenerationStatus,
  isGenerationErrorMessage,
} from '/src-ui/shared/utils/generationStatus';

const GenerationProgressContext = createContext(null);

export function GenerationProgressProvider({ children }) {
  const [generationStatus, setGenerationStatus] = useState(null);
  const [listenerError, setListenerError] = useState(null);
  const currentStage = useRef('narrative');
  const startedAt = useRef(null);
  const hasReceivedImage = useRef(false);
  const isComplete = useRef(false);

  useEffect(() => {
    let isActive = true;
    let unlisten;

    listen('sidecar-event', ({ payload }) => {
      if (payload?.type === 'log') {
        const update = getGenerationStatus(payload.payload, currentStage.current);
        if (!update) {
          return;
        }

        if (update.phase === 'error') {
          isComplete.current = true;
          setGenerationStatus(update);
          return;
        }

        if (update.isNarrativeRequest) {
          if (isComplete.current || startedAt.current === null) {
            startedAt.current = Date.now();
          } else {
            startedAt.current ??= Date.now();
          }
          currentStage.current = 'narrative';
          hasReceivedImage.current = false;
          isComplete.current = false;
        } else {
          currentStage.current = update.stage;
        }

        if (update.isRoundComplete && hasReceivedImage.current) {
          isComplete.current = true;
          setGenerationStatus({
            phase: 'complete',
            stage: 'complete',
            message: 'Rodada gerada.',
            startedAt: startedAt.current,
            elapsedMs: Date.now() - startedAt.current,
          });
          return;
        }

        setGenerationStatus({
          phase: 'generating',
          ...update,
          startedAt: startedAt.current,
        });
        return;
      }

      if (payload?.type === 'narrative') {
        if (isComplete.current) {
          return;
        }
        startedAt.current ??= Date.now();
        currentStage.current = 'analysis';
        setGenerationStatus({
          phase: 'generating',
          stage: 'analysis',
          message: 'Narrativa pronta. Preparando a análise da rodada...',
          startedAt: startedAt.current,
        });
        return;
      }

      if (
        payload?.type === 'image'
        && Array.isArray(payload.payload?.bytes)
        && typeof payload.payload?.contentType === 'string'
      ) {
        hasReceivedImage.current = true;
        setGenerationStatus({
          phase: 'generating',
          stage: 'image',
          message: 'Imagem pronta. Finalizando a geração da rodada...',
          startedAt: startedAt.current,
        });
        return;
      }

      if (payload?.type === 'system_message' && isGenerationErrorMessage(payload.payload?.text)) {
        isComplete.current = true;
        const message = payload.payload.text;
        setGenerationStatus({
          phase: 'error',
          stage: 'error',
          message: message.startsWith('ERRO')
            ? 'Não foi possível concluir a geração da rodada.'
            : message,
        });
      }
    }).then((stopListening) => {
      if (isActive) {
        unlisten = stopListening;
      } else {
        stopListening();
      }
    }).catch((error) => {
      console.error('Não foi possível acompanhar os eventos do backend:', error);
      if (isActive) {
        setListenerError(String(error));
      }
    });

    return () => {
      isActive = false;
      unlisten?.();
    };
  }, []);

  const beginGeneration = (message = 'Enviando sua ação ao motor de IA...') => {
    currentStage.current = 'narrative';
    startedAt.current = Date.now();
    hasReceivedImage.current = false;
    isComplete.current = false;
    setGenerationStatus({
      phase: 'generating',
      stage: 'narrative',
      message,
      startedAt: startedAt.current,
    });
  };

  const failGeneration = (message) => {
    isComplete.current = true;
    setGenerationStatus({
      phase: 'error',
      stage: 'error',
      message,
    });
  };

  return (
    <GenerationProgressContext.Provider
      value={{
        generationStatus,
        beginGeneration,
        failGeneration,
        listenerError,
      }}
    >
      {children}
    </GenerationProgressContext.Provider>
  );
}

export function useGenerationProgress() {
  const context = useContext(GenerationProgressContext);
  if (!context) {
    throw new Error('useGenerationProgress deve ser usado dentro de GenerationProgressProvider.');
  }
  return context;
}
