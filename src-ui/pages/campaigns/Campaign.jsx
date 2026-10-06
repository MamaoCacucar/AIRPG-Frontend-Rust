import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Header } from '/src-ui/shared/components/header/Header';
import { CampaignManageGrid } from './components/buttons/manage/CampaignManageGrid';
import { CampaignGrid } from './components/cards/CampaignGrid';
import { CampaignCard } from './components/cards/CampaignCard';
import { PosterGrid } from './components/posters/PosterGrid';
import { PosterCard } from './components/posters/PosterCard';
import styles from './CampaignStyle.module.css';

// Hook de dados
import { useCampaigns } from './hooks/useCampaigns';

export function Campaign({ adminEnabled = false }) {
  const navigate = useNavigate();
  const { activeCampaigns, campaigns, isLoading } = useCampaigns(adminEnabled);
  const [startingCampaignId, setStartingCampaignId] = useState(null);
  const [startError, setStartError] = useState(null);

  const startCampaign = async (campaign) => {
    setStartingCampaignId(campaign.id);
    setStartError(null);

    try {
      await invoke('start_campaign', {
        campaignPath: campaign.path,
        campaignTags: campaign.tags,
      });
      navigate(`/game/${campaign.id}`);
    } catch (error) {
      console.error(`Erro ao iniciar a campanha "${campaign.title}":`, error);
      setStartError(String(error));
    } finally {
      setStartingCampaignId(null);
    }
  };

  const headerOptions = [
    { label: 'Biblioteca', onClick: () => console.log('Biblioteca clicada') },
    { label: 'Comunidade', onClick: () => console.log('Comunidade clicada') },
    { label: 'Criar', onClick: () => console.log('Criar clicado') }
  ];

  if (isLoading) {
    return <div className={styles.pageContainer}><p>Carregando banco de dados...</p></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <Header options={headerOptions} />
      <div className={styles.contentContainer}>
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
    </div>
  );
}