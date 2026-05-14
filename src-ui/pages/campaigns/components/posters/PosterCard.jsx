import React from 'react';
import styles from './PosterCardStyle.module.css';
import { CampaignCardActions } from '../buttons/action/CampaignCardActions';

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

export function PosterCard({ title, tags, imageSrc, onContinue, onEdit, onShare }) {
  console.log({ title, tags, imageSrc })
  return (
    <article className={styles.card}>
      <img className={styles.image} src={imageSrc} alt={`Poster da campanha ${title}`} />
      
      <div className={styles.overlay}>
        <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: title }} />
        <span className={styles.tags}>{cleanTags(tags)}</span>
        <CampaignCardActions 
          className={styles.actionsContainer}
          title="Iniciar"
          onContinue={onContinue} 
          onEdit={onEdit} 
          onShare={onShare} 
        />
      </div>
    </article>
  );
}
