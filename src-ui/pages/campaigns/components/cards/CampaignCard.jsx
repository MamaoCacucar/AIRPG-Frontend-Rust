import React from 'react';
import styles from './CampaignCardStyle.module.css';
import featherIcon from '../../../../assets/icons/feather.svg';
import shareIcon from '../../../../assets/icons/share.svg';
import playIcon from '../../../../assets/icons/play.svg';

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
          <div className={styles.actionsContainer}>
            <button
              onClick={onContinue}
              className={styles.primaryButton}
            >
              {/* Ícone de Play (Substitua pelo seu SVG oficial se preferir) */}
              {/* <svg width="11" height="14" viewBox="0 0 11 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 7L0.5 13.0622L0.5 0.937822L11 7Z" />
              </svg> */}
              <img src={playIcon} alt="Continuar" className={styles.icon}/>
              <span className={styles.continueText}>CONTINUAR</span>
            </button>

            <button onClick={onEdit} className={styles.secondaryButton}>
              <img src={featherIcon} alt="Editar" className={styles.icon}/>
            </button>

            <button onClick={onShare} className={styles.secondaryButton}>
              <img src={shareIcon} alt="Compartilhar" className={styles.icon}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}