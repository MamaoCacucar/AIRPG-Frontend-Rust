import styles from '../style.module.css';

export const NavItem = ({ iconSrc, label, isActive, onClick }) => (
  <div onClick={onClick} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
    <div className={styles.navIcon}>
      <img src={iconSrc} alt={`${label} icon`} />
    </div>
    <span className={styles.navLabel}>{label}</span>
  </div>
);