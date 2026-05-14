import styles from '../SideMenuStyle.module.css';

export const ProfileInfo = ({ user }) => (
  <footer className={styles.sideMenuFooter}>
    <img 
      className={styles.profileAvatar} 
      src={user.avatarUrl} 
      alt={`Avatar de ${user.name}`} 
    />
    <div className={styles.profileContent}>
      <span className={styles.profileName}>{user.name}</span>
      <span className={styles.profileRole}>{user.role}</span>
    </div>
  </footer>
);