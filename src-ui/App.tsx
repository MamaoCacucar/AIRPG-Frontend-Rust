import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export default function CampaignSelector() {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Carrega as campanhas do Rust ao abrir a tela
  useEffect(() => {
    invoke<string[]>('get_campaigns')
      .then(setCampaigns)
      .catch(console.error);
  }, []);

  const handleSelectCampaign = async (campaignName: string) => {
    try {
      // Avisa o Rust para ligar o executável Python isolado
      const response = await invoke<string>('start_engine', { campaignName });
      console.log(response);
      
      // Muda a tela para o HUD / Terminal
      setIsPlaying(true);
    } catch (error) {
      console.error("Erro ao iniciar a engine:", error);
    }
  };

  if (isPlaying) {
    return <div>Terminal do RPG carregando... (Aqui entra sua UI de jogo)</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl mb-8 font-mono">Selecione sua Campanha</h1>
      <div className="grid gap-4">
        {campaigns.map((camp) => (
          <button 
            key={camp}
            onClick={() => handleSelectCampaign(camp)}
            className="p-4 border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            {camp}
          </button>
        ))}
      </div>
    </div>
  );
}