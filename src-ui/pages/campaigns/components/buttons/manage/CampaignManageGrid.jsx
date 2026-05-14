import React from 'react';
import { CampaignManageButton } from './CampaignManageButton';
import styles from './CampaignManageGridStyle.module.css';

import PlusIcon from '/src-ui/assets/icons/plus.svg';
import PenIcon from '/src-ui/assets/icons/pen.svg';
import CloudIcon from '/src-ui/assets/icons/cloud.svg';

export function CampaignManageGrid() {
  const actions = [
    {
      id: 'create',
      title: 'Criar campanha',
      description: 'Comece uma nova jornada do zero',
      icon: PlusIcon,
    },
    {
      id: 'edit',
      title: 'Editar campanha',
      description: 'Modifique suas crônicas existentes',
      icon: PenIcon,
    },
    {
      id: 'load',
      title: 'Carregar um save',
      description: 'Recupere o progresso da nuvem',
      icon: CloudIcon,
    }
  ];

  return (
    <div>
      <div className={styles.visualDivider}/>
      <div className={styles.gridContainer}>
        {actions.map((action) => (
          <CampaignManageButton
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
          />
        ))}
      </div>
    </div>
  );
}