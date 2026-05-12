import React from 'react';
import './style.css';

// Importando corretamente os assets usando a sintaxe do ES6
import bookIcon from '../../../assets/icons/book.svg';
import galleryIcon from '../../../assets/icons/gallery.svg';
import manuscriptIcon from '../../../assets/icons/manuscript.svg';
import settingsIcon from '../../../assets/icons/settings.svg';
import defaultAvatar from '../../../assets/templates/user.svg';

// 1. Componente de Título Extraído (Evita repetição e acopla a marca)
const BrandTitle = ({ title, subtitle }) => (
  <header className="side-menu-header">
    <h1 className="brand-title">{title}</h1>
    <span className="brand-subtitle">{subtitle}</span>
  </header>
);

// 2. Componente de Navegação Extraído (Evita repetição das tags html)
const NavItem = ({ iconSrc, label, isActive, href = "#" }) => (
  <a href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
    <div className="nav-icon">
      <img src={iconSrc} alt={`${label} icon`} />
    </div>
    <span className="nav-label">{label}</span>
  </a>
);

// Dados do menu para renderização dinâmica
const NAV_ITEMS = [
  { id: 'campaigns', icon: bookIcon, label: 'Campanhas', isActive: true },
  { id: 'gallery', icon: galleryIcon, label: 'Galeria', isActive: false },
  { id: 'master', icon: manuscriptIcon, label: 'Mestre', isActive: false },
  { id: 'settings', icon: settingsIcon, label: 'Configurações', isActive: false },
];

export function SideMenu({ 
  user = { 
    name: 'Mestre Felpinho', 
    role: 'O Dominador', 
    avatarUrl: defaultAvatar 
  } 
}) {
  return (
    <aside className="side-menu-container">
      <BrandTitle title="FELPINHO's" subtitle="RPG ENGINE" />

      {/* Navigation */}
      <nav className="side-menu-nav">
        {NAV_ITEMS.map((item) => (
          <NavItem 
            key={item.id}
            iconSrc={item.icon}
            label={item.label}
            isActive={item.isActive}
          />
        ))}
      </nav>

      {/* Footer / Profile */}
      <footer className="side-menu-footer">
        <img 
          className="profile-avatar" 
          src={user.avatarUrl} 
          alt={`Avatar de ${user.name}`} 
        />
        <div className="profile-info">
          <span className="profile-name">{user.name}</span>
          <span className="profile-role">{user.role}</span>
        </div>
      </footer>
    </aside>
  );
}