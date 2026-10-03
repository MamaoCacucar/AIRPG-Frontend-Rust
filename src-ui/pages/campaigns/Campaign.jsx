import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '/src-ui/shared/components/header/Header';
import { CampaignManageGrid } from './components/buttons/manage/CampaignManageGrid';
import { CampaignGrid } from './components/cards/CampaignGrid';
import { CampaignCard } from './components/cards/CampaignCard';
import { PosterGrid } from './components/posters/PosterGrid';
import { PosterCard } from './components/posters/PosterCard';
import styles from './CampaignStyle.module.css';

// Hook de dados
import { useCampaigns } from './hooks/useCampaigns';

export function Campaign() {
  const navigate = useNavigate();
  const { activeCampaigns, campaigns, isLoading } = useCampaigns();

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
              imageUrl={activeCampaign.imageUrl}
              // Aqui passamos o direcionamento exigido para o botão primário do CampaignCardActions
              onPlay={() => navigate(`/game/${activeCampaign.id}`)}
            />
          ))}
        </CampaignGrid>
        
        <CampaignManageGrid />
        
        <p className={styles.sectionTitle}>Iniciar nova campanha</p>
        <PosterGrid>
          {campaigns.map((campaign) => (
            <PosterCard
              key={campaign.id}
              title={campaign.title}
              tags={campaign.tags}
              players={campaign.players}
              imageSrc={campaign.poster_url}
              onPlay={() => navigate(`/game/${campaign.id}`)}
            />
          ))}
        </PosterGrid>
      </div>
    </div>
  );
}