import React from 'react';
import { Header } from '/src-ui/shared/components/header/Header';
import { CampaignManageGrid } from './components/buttons/manage/CampaignManageGrid';
import { CampaignGrid } from './components/cards/CampaignGrid';
import { CampaignCard } from './components/cards/CampaignCard';
import { PosterGrid } from './components/posters/PosterGrid';
import { PosterCard } from './components/posters/PosterCard';
import campaignImage from '/src-ui/assets/templates/campaign.png';
import posterImage from '/src-ui/assets/templates/posterCampaign.png';
import styles from './CampaignStyle.module.css';

export function Campaign() {
  const headerOptions = [
    { label: 'Biblioteca', onClick: () => console.log('Biblioteca clicada') },
    { label: 'Comunidade', onClick: () => console.log('Comunidade clicada') },
    { label: 'Criar', onClick: () => console.log('Criar clicado') }
  ];

  const campaigns = [
    {
      id: 1,
      tag: "ÚLTIMA SESSÃO",
      title: "Neon Drift: Neo-Tokyo",
      description: "“Andando pelo beco onde apenas leds brilham...” • 4° Rodada",
      imageUrl: campaignImage
    },
    {
      id: 2,
      tag: "CAMPANHA MAIS LONGA",
      title: "Catacumbas de Eldoria",
      description: "“Você finalmente alcança o fim das catacumbas...” • 50° Rodada",
      imageUrl: campaignImage
    },
    {
      id: 3,
      tag: "LOBISOMEM SEGUE DESAPARECIDO",
      title: "Bosque de Prata",
      description: "“O vilarejo teme o pior...” • 10° Rodada",
      imageUrl: campaignImage
    },
    {
      id: 4,
      tag: "LOBISOMEM SEGUE DESAPARECIDO",
      title: "Bosque de Prata",
      description: "“O vilarejo teme o pior...” • 10° Rodada",
      imageUrl: campaignImage
    }
  ];

  const posterCampaigns = [
    {
      id: 1,
      title: 'O Despertar dos Deuses',
      tags: ['ÉPICO', 'ALTA FANTASIA'],
      imageSrc: posterImage
    },
    {
      id: 2,
      title: 'Sombras de Londres',
      tags: ['MISTÉRIO', 'GÓTICO'],
      imageSrc: posterImage
    },
    {
      id: 3,
      title: 'Po Poeira & Aço',
      tags: ['POST-APOCALYPTIC', 'MECHA'],
      imageSrc: posterImage
    },
    {
      id: 4,
      title: 'Caminho do Zen',
      tags: ['HISTÓRICO', 'testes', 'SAMURAI'],
      imageSrc: posterImage
    },
    {
      id: 5,
      title: 'Nebulosa Onírica',
      tags: ['EXPERIMENTAL', 'SURREAL', 'test'],
      imageSrc: posterImage
    },
    {
      id: 6,
      title: 'Nebulosa',
      tags: ['SURREAL'],
      imageSrc: posterImage
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <Header options={headerOptions} />
      <div className={styles.contentContainer}>
        <p className={styles.sectionTitle}>Continuar campanha</p>
        <CampaignGrid>
          {campaigns.map((camp) => (
            <CampaignCard
              key={camp.id}
              tag={camp.tag}
              title={camp.title}
              description={camp.description}
              imageUrl={camp.imageUrl}
              onContinue={() => console.log(`Continuando: ${camp.title}`)}
            />
          ))}
        </CampaignGrid>
        <CampaignManageGrid />
        <p className={styles.sectionTitle}>Iniciar nova campanha</p>
        <PosterGrid>
          {posterCampaigns.map((posterCampaigns) => (
            <PosterCard
              key={posterCampaigns.id}
              title={posterCampaigns.title}
              tags={posterCampaigns.tags}
              players={posterCampaigns.players}
              imageSrc={posterCampaigns.imageSrc}
            />
          ))}
        </PosterGrid>
      </div>
    </div>
  );
}