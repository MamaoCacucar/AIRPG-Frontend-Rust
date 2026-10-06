import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import arrowToLeft from '../../../../assets/icons/arrow_to_left.svg';
import styles from './ImageCarousel.module.css';

const EMPTY_IMAGES = [];

export function ImageCarousel({
  images,
  title,
  imageClassName = '',
  controlsVisible = false
}) {
  const [loadedImages, setLoadedImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const imagePaths = Array.isArray(images) ? images : EMPTY_IMAGES;

  useEffect(() => {
    let isCurrent = true;
    const objectUrls = [];
    setLoadedImages([]);
    setActiveIndex(0);

    if (!imagePaths.length) {
      return undefined;
    }

    Promise.all(imagePaths.map(async (imagePath) => {
      try {
        const { bytes, contentType } = await invoke('get_campaign_image', { path: imagePath });
        if (!isCurrent) {
          return null;
        }
        const objectUrl = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: contentType })
        );
        objectUrls.push(objectUrl);
        return objectUrl;
      } catch (error) {
        console.error(`Erro ao carregar imagem da campanha "${title}":`, error);
        return null;
      }
    })).then((result) => {
      if (isCurrent) {
        setLoadedImages(result.filter(Boolean));
      }
    });

    return () => {
      isCurrent = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [imagePaths, title]);

  useEffect(() => {
    if (loadedImages.length < 2) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % loadedImages.length);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, loadedImages]);

  if (!loadedImages.length) {
    return null;
  }

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + loadedImages.length) % loadedImages.length);
  };
  const showNext = () => {
    setActiveIndex((index) => (index + 1) % loadedImages.length);
  };

  return (
    <div className={styles.carousel} aria-label={`Imagens da campanha ${title}`}>
      {loadedImages.map((imageUrl, index) => (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={`${title} - imagem ${index + 1}`}
          className={`${styles.image} ${imageClassName} ${index === activeIndex ? styles.active : ''}`.trim()}
          aria-hidden={index !== activeIndex}
        />
      ))}
      {loadedImages.length > 1 && (
        <div className={`${styles.controls} ${controlsVisible ? styles.visible : ''}`.trim()}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Exibir imagem anterior"
            onClick={showPrevious}
          >
            <img src={arrowToLeft} alt="" />
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Exibir próxima imagem"
            onClick={showNext}
          >
            <img src={arrowToLeft} alt="" className={styles.rightArrow} />
          </button>
        </div>
      )}
    </div>
  );
}
