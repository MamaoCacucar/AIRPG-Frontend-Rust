import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SideMenu } from "./shared/components/side-menu/SideMenu";
import { Campaign } from './pages/campaigns/Campaign';
import { Game } from './pages/game/Game';
import { GenerationProgressProvider } from './shared/context/generation-progress/GenerationProgressContext';
import styles from './AppStyle.module.css';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminEnabled, setAdminEnabled] = useState(false);
  const isGameRoute = location.pathname.startsWith('/game');

  return (
    <GenerationProgressProvider>
      <div className={styles.appContainer}>
        {!isGameRoute && <SideMenu />}
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Navigate to="/campaigns" replace />} />
            <Route path="/campaigns" element={<Campaign adminEnabled={adminEnabled} />} />
            <Route path="/gallery" element={<div>Conteúdo da Galeria</div>} />
            <Route path="/master" element={<div>Conteúdo do Mestre</div>} />
            <Route
              path="/settings"
              element={<Settings adminEnabled={adminEnabled} onAdminCodeChange={(code) => {
                if (code === ',3') {
                  setAdminEnabled(true);
                  navigate('/campaigns');
                }
              }} />}
            />
            <Route path="/game/:id" element={<Game />} />
          </Routes>
        </main>
      </div>
    </GenerationProgressProvider>
  );
}

function Settings({ adminEnabled, onAdminCodeChange }) {
  return (
    <div>
      Configurações da Aplicação
      <br />
      <input
        type="text"
        placeholder="user"
        aria-label="Usuário"
        onChange={(event) => onAdminCodeChange(event.target.value)}
      />
      {adminEnabled && <p>Modo Admin ativo</p>}
    </div>
  );
}