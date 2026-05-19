import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SideMenu } from "./shared/components/side-menu/SideMenu";
import { Campaign } from './pages/campaigns/Campaign';
import { Game } from './pages/game/Game';
import styles from './AppStyle.module.css';

export default function App() {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game');

  return (
    <div className={styles.appContainer}>
      {!isGameRoute && <SideMenu />}
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<Campaign />} />
          <Route path="/gallery" element={<div>Conteúdo da Galeria</div>} />
          <Route path="/master" element={<div>Conteúdo do Mestre</div>} />
          <Route path="/settings" element={<div>Configurações da Aplicação</div>} />
          <Route path="/game" element={<Game campaignId={1} campaignTitle="As Crônicas de Obsidiana" roundNumber={32}/>} /> 
        </Routes>
      </main>
    </div>
  );
}