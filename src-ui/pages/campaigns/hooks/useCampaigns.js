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

export function useCampaigns(adminEnabled = false) {
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function fetchCampaigns() {
      setIsLoading(true);
      setError(null);

      try {
        // Chamadas ao backend Rust via Tauri IPC
        const activeCampaigns = await invoke('get_active_campaigns');
        const campaigns = await invoke('get_campaigns');
        let listedCampaigns = campaigns;

        if (adminEnabled) {
          try {
            const secretCampaigns = await invoke('get_secret_campaigns', {
              adminCode: 'admin'
            });
            listedCampaigns = [...campaigns, ...secretCampaigns];
          } catch (error) {
            console.error('Erro ao carregar campanhas secretas:', error);
            if (isActive) {
              setError(`Não foi possível carregar as campanhas secretas: ${String(error)}`);
            }
          }
        }

        for (const campaign of listedCampaigns) {
          if (campaign.missing_fields?.length) {
            console.error(
              `A campanha "${campaign.id}" não possui os campos: ${campaign.missing_fields.join(', ')}`
            );
          }
        }
        
        if (isActive) {
          setActiveCampaigns(activeCampaigns);
          setCampaigns(listedCampaigns);
        }
      } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
        if (isActive) {
          setError(`Não foi possível carregar as campanhas: ${String(error)}`);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchCampaigns();

    return () => {
      isActive = false;
    };
  }, [adminEnabled]);

  return { activeCampaigns, campaigns, isLoading, error };
}