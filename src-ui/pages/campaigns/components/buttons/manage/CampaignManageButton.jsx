import React from 'react';
import styles from './CampaignManageButtonStyle.module.css';

export function CampaignManageButton({ title, description, icon: Icon }) {
  return (
    <button className={styles.buttonContainer}>
      <div className={styles.iconWrapper}>
        {Icon && <img src={Icon} alt="" className={styles.icon} />}
      </div>
      <div className={styles.textContainer}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </div>
    </button>
  );
}