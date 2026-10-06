import React, { useState } from 'react';
import styles from './PosterCardStyle.module.css';
import { CampaignCardActions } from '../buttons/action/CampaignCardActions';
import { ImageCarousel } from '../image-carousel/ImageCarousel';

function cleanTags(tags) {
  let cleanTags = '';
  for (let i = 0; i < tags.length; i++) {
      if (i === tags.length - 1) {
          cleanTags += tags[i].toUpperCase();
      } else {
          cleanTags += tags[i].toUpperCase() + ' • ';
      }
  }
  return cleanTags;
}

export function PosterCard({ title, tags, images, onPlay, onEdit, onShare, isStarting = false }) {
  const [controlsVisible, setControlsVisible] = useState(false);

  return (
    <article
      className={styles.card}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <ImageCarousel
        images={images}
        title={title}
        imageClassName={styles.image}
        controlsVisible={controlsVisible}
      />
      
      <div className={styles.overlay}>
        <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: title }} />
        <span className={styles.tags}>{cleanTags(tags)}</span>
        <CampaignCardActions 
          className={styles.actionsContainer}
          title={isStarting ? 'Iniciando...' : 'Iniciar'}
          onPlay={onPlay} 
          onEdit={onEdit} 
          onShare={onShare} 
          disabled={isStarting}
        />
      </div>
    </article>
  );
}
