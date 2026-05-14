import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from './components/SearchBar';
import styles from './HeaderStyle.module.css';

// Importe o SVG do usuário baseado nos seus assets disponíveis
import userIcon from '../../../assets/templates/user.svg';
import notificationIcon from '../../../assets/icons/notification.svg';

export function Header({ options = [], showSearch = true }) {
  // Estado para controlar a aba ativa (seleciona a primeira por padrão)
  const [activeOption, setActiveOption] = useState(options[0]?.label || '');

  return (
    <header className={styles.header}>
      {/* Menu de Navegação */}
      <nav className={styles.navGroup}>
        {options.map((option, index) => (
          <button
            key={index}
            className={`${styles.navItem} ${activeOption === option.label ? styles.active : ''}`}
            onClick={() => {
              setActiveOption(option.label);
              if (option.onClick) option.onClick();
            }}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {/* Barra de Pesquisa Condicional */}
      {showSearch && <SearchBar />}

      {/* Ações do Usuário */}
      <div className={styles.userActions}>
        {/* Placeholder para outro ícone genérico (ex: notificações) */}
        <div>
            <img src={notificationIcon} alt="Notificações" className={styles.icon} />
        </div>
        
        {/* Ícone de Perfil com Redirecionamento */}
        <Link to="/settings/profile" className={styles.profileLink}>
          <img src={userIcon} alt="Perfil do Usuário" className={styles.userIcon} />
        </Link>
      </div>
    </header>
  );
}