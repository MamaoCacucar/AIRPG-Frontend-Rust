import React, { useState } from 'react';
import styles from './CampaignCardStyle.module.css';
import { CampaignCardActions } from '../buttons/action/CampaignCardActions';
import { ImageCarousel } from '../image-carousel/ImageCarousel';

export function CampaignCard({
  tag,
  title,
  description,
  images,
  isMain = false,
  className = '',
  onPlay,
  onEdit,
  onShare
}) {
  const [controlsVisible, setControlsVisible] = useState(false);

  return (
    <div 
      className={`${styles.card} ${className}`.trim()}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <ImageCarousel
        images={images}
        title={title}
        imageClassName={styles.cardImage}
        controlsVisible={controlsVisible}
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
            onPlay={onPlay} 
            onEdit={onEdit} 
            onShare={onShare} 
          />
        </div>
      </div>
    </div>
  );
}