import { Routes, Route, Navigate } from 'react-router-dom';
import { SideMenu } from "./shared/components/side-menu/sideMenu";
import { Header } from './shared/components/header/Header';
import { CampaignGrid } from './pages/campaigns/components/cards/CampaignGrid';
import { CampaignCard } from './pages/campaigns/components/cards/CampaignCard';

export default function App() {
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
      imageUrl: "https://placehold.co/742x498"
    },
    {
      id: 2,
      tag: "CAMPANHA MAIS LONGA",
      title: "Catacumbas de Eldoria",
      description: "“Você finalmente alcança o fim das catacumbas...” • 50° Rodada",
      imageUrl: "https://placehold.co/438x498"
    },
    {
      id: 3,
      tag: "LOBISOMEM SEGUE DESAPARECIDO",
      title: "Bosque de Prata",
      description: "“O vilarejo teme o pior...” • 10° Rodada",
      imageUrl: "https://placehold.co/286x240"
    },
    {
      id: 4,
      tag: "LOBISOMEM SEGUE DESAPARECIDO",
      title: "Bosque de Prata",
      description: "“O vilarejo teme o pior...” • 10° Rodada",
      imageUrl: "https://placehold.co/286x240"
    }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <SideMenu />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Header options={headerOptions} />
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<div><CampaignGrid>
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
      </CampaignGrid></div>} />
          <Route path="/gallery" element={<div>Conteúdo da Galeria</div>} />
          <Route path="/master" element={<div>Conteúdo do Mestre</div>} />
          <Route path="/settings" element={<div>Configurações da Aplicação</div>} />
        </Routes>
      </main>
    </div>
  );
}