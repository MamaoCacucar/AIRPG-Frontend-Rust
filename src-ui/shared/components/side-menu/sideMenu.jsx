import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SideMenuStyle.module.css';
import { BrandTitle } from './components/BrandTitle';
import { NavItem } from './components/NavItem';
import { ProfileInfo } from './components/ProfileInfo';

import bookIcon from '../../../assets/icons/book.svg';
import galleryIcon from '../../../assets/icons/gallery.svg';
import manuscriptIcon from '../../../assets/icons/manuscript.svg';
import settingsIcon from '../../../assets/icons/settings.svg';
import defaultAvatar from '../../../assets/templates/user.svg';

const NAV_ITEMS = [
  { id: 'campaigns', icon: bookIcon, label: 'Campanhas', path: '/campaigns' },
  { id: 'gallery', icon: galleryIcon, label: 'Galeria', path: '/gallery' },
  { id: 'master', icon: manuscriptIcon, label: 'Mestre', path: '/master' },
  { id: 'settings', icon: settingsIcon, label: 'Configurações', path: '/settings' },
];

export function SideMenu({ 
  user = { 
    name: 'Mestre Felpinho', 
    role: 'O Dominador', 
    avatarUrl: defaultAvatar 
  } 
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={styles.sideMenuContainer}>
      <BrandTitle title="FELPINHO's" subtitle="RPG ENGINE" />

      <nav className={styles.sideMenuNav}>
        {NAV_ITEMS.map((item) => (
          <NavItem 
            key={item.id}
            iconSrc={item.icon}
            label={item.label}
            isActive={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <ProfileInfo user={user} />
    </aside>
  );
}