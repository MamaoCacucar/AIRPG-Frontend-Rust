import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Header } from '/src-ui/shared/components/header/Header';
import { LoadingModal } from '/src-ui/shared/components/loading-modal/LoadingModal';
import { useGenerationProgress } from '/src-ui/shared/context/generation-progress/GenerationProgressContext';
import { CampaignManageGrid } from './components/buttons/manage/CampaignManageGrid';
import { CampaignGrid } from './components/cards/CampaignGrid';
import { CampaignCard } from './components/cards/CampaignCard';
import { PosterGrid } from './components/posters/PosterGrid';
import { PosterCard } from './components/posters/PosterCard';
import styles from './CampaignStyle.module.css';
import {
  getGenerationStatus,
  isGenerationErrorMessage,
} from '/src-ui/shared/utils/generationStatus';

// Hook de dados
import { useCampaigns } from './hooks/useCampaigns';

export function Campaign({ adminEnabled = false }) {
  const navigate = useNavigate();
  const { beginGeneration, listenerError } = useGenerationProgress();
  const { activeCampaigns, campaigns, isLoading, error: campaignsError } = useCampaigns(adminEnabled);
  const [startingCampaignId, setStartingCampaignId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Carregando campanhas...');
  const [startError, setStartError] = useState(null);

  const startCampaign = async (campaign) => {
    if (listenerError) {
      setStartError(`Não é possível acompanhar a geração: ${listenerError}`);
      return;
    }

    setStartingCampaignId(campaign.id);
    setLoadingMessage('Preparando a campanha...');
    setStartError(null);

    let resolveRequest;
    let rejectRequest;
    let generationStartedAt = null;
    const requestStarted = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    requestStarted.catch(() => {});

    try {
      const unlisten = await listen('sidecar-event', ({ payload }) => {
        if (payload?.type === 'log') {
          const status = getGenerationStatus(payload.payload);
          if (status) {
            setLoadingMessage(status.message);
            if (status.phase === 'error') {
              rejectRequest(new Error(status.message));
            } else if (status.isNarrativeRequest && generationStartedAt === null) {
              generationStartedAt = Date.now();
              beginGeneration(status.message);
              resolveRequest(status);
            }
          }
        } else if (payload?.type === 'system_message') {
          const message = payload.payload?.text;
          if (isGenerationErrorMessage(message)) {
            rejectRequest(new Error(message));
          }
        }
      });

      try {
        await invoke('start_campaign', {
          campaignPath: campaign.path,
          campaignTags: campaign.tags,
        });
        const initialStatus = await requestStarted;
        navigate(`/game/${campaign.id}`, {
          state: {
            generationStartedAt,
            generationStatus: initialStatus.message,
          },
        });
      } finally {
        unlisten();
      }
    } catch (error) {
      console.error(`Erro ao iniciar a campanha "${campaign.title}":`, error);
      setStartError(String(error));
      setStartingCampaignId(null);
    }
  };

  const headerOptions = [
    { label: 'Biblioteca', onClick: () => console.log('Biblioteca clicada') },
    { label: 'Comunidade', onClick: () => console.log('Comunidade clicada') },
    { label: 'Criar', onClick: () => console.log('Criar clicado') }
  ];

  return (
    <div className={styles.pageContainer}>
      <Header options={headerOptions} />
      <div className={styles.contentContainer}>
        {campaignsError && <p role="alert">{campaignsError}</p>}
        <p className={styles.sectionTitle}>Continuar campanha</p>
        <CampaignGrid>
          {activeCampaigns.map((activeCampaign) => (
            <CampaignCard
              key={activeCampaign.id}
              tag={activeCampaign.tag}
              title={activeCampaign.title}
              description={activeCampaign.description}
              images={campaigns.find((campaign) => campaign.id === activeCampaign.id)?.banner_images}
              // Aqui passamos o direcionamento exigido para o botão primário do CampaignCardActions
              onPlay={() => navigate(`/game/${activeCampaign.id}`)}
            />
          ))}
        </CampaignGrid>
        
        <CampaignManageGrid />
        
        <p className={styles.sectionTitle}>Iniciar nova campanha</p>
        {startError && <p role="alert">Não foi possível iniciar a campanha: {startError}</p>}
        {startingCampaignId === null && !isLoading && campaigns.length === 0 && !campaignsError && (
          <p>Nenhuma campanha disponível.</p>
        )}
        <PosterGrid>
          {campaigns.map((campaign) => (
            <PosterCard
              key={campaign.id}
              title={campaign.title}
              tags={campaign.tags}
              players={campaign.players}
              images={campaign.poster_images}
              isStarting={startingCampaignId !== null}
              onPlay={() => startCampaign(campaign)}
            />
          ))}
        </PosterGrid>
      </div>
      {(isLoading || startingCampaignId !== null) && (
        <LoadingModal
          message={isLoading && startingCampaignId === null
            ? 'Carregando campanhas...'
            : loadingMessage}
        />
      )}
    </div>
  );
}