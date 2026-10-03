import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './PosterCardStyle.module.css';
import { CampaignCardActions } from '../buttons/action/CampaignCardActions';

function isLocalPath(imageSrc) {
  return /^[a-zA-Z]:[\\/]/.test(imageSrc) || imageSrc.startsWith('\\\\');
}

function resolvePublicPosterUrl(imageSrc) {
  const normalizedPath = imageSrc.replace(/\\/g, '/');
  const publicDirectoryIndex = normalizedPath.toLowerCase().lastIndexOf('/public/');

  if (publicDirectoryIndex === -1) {
    return imageSrc;
  }

  return normalizedPath.slice(publicDirectoryIndex + '/public'.length);
}

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

export function PosterCard({ title, tags, imageSrc, onPlay, onEdit, onShare }) {
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const localImage = isLocalPath(imageSrc);

  useEffect(() => {
    if (!localImage) {
      setLocalImageUrl(null);
      return undefined;
    }

    let objectUrl;
    let isCurrent = true;

    invoke('get_campaign_image', { path: imageSrc })
      .then(({ bytes, contentType }) => {
        if (!isCurrent) {
          return;
        }

        objectUrl = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: contentType })
        );
        setLocalImageUrl(objectUrl);
      })
      .catch((error) => {
        console.error(`Erro ao carregar o poster da campanha "${title}":`, error);
      });

    return () => {
      isCurrent = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageSrc, localImage, title]);

  const posterUrl = localImage ? localImageUrl : resolvePublicPosterUrl(imageSrc);

  return (
    <article className={styles.card}>
      {posterUrl && <img className={styles.image} src={posterUrl} alt={`Poster da campanha ${title}`} />}
      
      <div className={styles.overlay}>
        <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: title }} />
        <span className={styles.tags}>{cleanTags(tags)}</span>
        <CampaignCardActions 
          className={styles.actionsContainer}
          title="Iniciar"
          onPlay={onPlay} 
          onEdit={onEdit} 
          onShare={onShare} 
        />
      </div>
    </article>
  );
}
