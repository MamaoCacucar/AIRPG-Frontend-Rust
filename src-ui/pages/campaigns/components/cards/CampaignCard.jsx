import React from 'react';
import styles from './CampaignCardStyle.module.css';
import { CampaignCardActions } from '../buttons/action/CampaignCardActions';

export function CampaignCard({
  tag,
  title,
  description,
  imageUrl,
  isMain = false,
  className = '',
  onContinue,
  onEdit,
  onShare
}) {
  return (
    <div 
      className={`${styles.card} ${className}`.trim()}
    >
      {/* Imagem de Fundo com efeito sutil no hover */}
      <img
        src={imageUrl}
        alt={title}
        className={styles.cardImage}
      />

      {/* Gradiente de fundo para legibilidade do texto */}
      <div className={styles.gradientOverlay}>
        
        <div className={styles.contentWrapper}>
          {/* Tag / Categoria */}
          <span className={styles.tag}>
            {tag}
          </span>

          {/* Título */}
          <h3 className={`${styles.title} ${isMain ? styles.titleMain : styles.titleNormal}`}>
            {title}
          </h3>

          {/* Descrição */}
          <p className={`${styles.description} ${isMain ? styles.descriptionMain : styles.descriptionNormal}`}>
            {description}
          </p>

          {/* Container de Ações (Exibido apenas no hover do card) */}
          <CampaignCardActions 
            className={styles.actionsContainer}
            title="Continuar"
            onContinue={onContinue} 
            onEdit={onEdit} 
            onShare={onShare} 
          />
        </div>
      </div>
    </div>
  );
}