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
  const [campaigns, setCampaigns] = useState([]);
  const [posters, setPosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // Chamadas ao backend Rust via Tauri IPC
        const loadedCampaigns = await invoke('get_active_campaigns');
        const loadedPosters = await invoke('get_poster_campaigns');
        
        setCampaigns(loadedCampaigns);
        setPosters(loadedPosters);
      } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return { campaigns, posters, isLoading };
}