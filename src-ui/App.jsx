import { Routes, Route, Navigate } from 'react-router-dom';
import { SideMenu } from "./shared/components/side-menu/SideMenu";
import { Campaign } from './pages/campaigns/Campaign';

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <SideMenu />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<Campaign />} />
          <Route path="/gallery" element={<div>Conteúdo da Galeria</div>} />
          <Route path="/master" element={<div>Conteúdo do Mestre</div>} />
          <Route path="/settings" element={<div>Configurações da Aplicação</div>} />
        </Routes>
      </main>
    </div>
  );
}