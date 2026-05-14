import React from 'react';
import styles from './CampaignCardActionsStyle.module.css';
import featherIcon from '/src-ui/assets/icons/feather.svg';
import shareIcon from '/src-ui/assets/icons/share.svg';
import playIcon from '/src-ui/assets/icons/play.svg';

export function CampaignCardActions({ title, onContinue, onEdit, onShare, className = '' }) {
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <button onClick={onContinue} className={styles.primaryButton}>
        <img src={playIcon} alt={title || 'botão principal'} className={styles.icon} />
        <span className={styles.continueText}>{title}</span>
      </button>

      <button onClick={onEdit} className={styles.secondaryButton}>
        <img src={featherIcon} alt="Editar" className={styles.icon} />
      </button>

      <button onClick={onShare} className={styles.secondaryButton}>
        <img src={shareIcon} alt="Compartilhar" className={styles.icon} />
      </button>
    </div>
  );
}