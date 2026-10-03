import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * @typedef {Object} CampaignData
 * @property {string|number} id
 * @property {string} tag
 * @property {string} title
 * @property {string} description
 * @property {string} imageUrl
 */

export function useCampaigns() {
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // Chamadas ao backend Rust via Tauri IPC
        const activeCampaigns = await invoke('get_active_campaigns');
        const campaigns = await invoke('get_campaigns');
        
        setActiveCampaigns(activeCampaigns);
        setCampaigns(campaigns);
      } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return { activeCampaigns, campaigns, isLoading };
}