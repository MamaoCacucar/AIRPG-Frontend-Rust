import styles from '../style.module.css';

export const BrandTitle = ({ title, subtitle }) => (
  <header className={styles.sideMenuHeader}>
    <h1 className={styles.brandTitle}>{title}</h1>
    <span className={styles.brandSubtitle}>{subtitle}</span>
  </header>
);