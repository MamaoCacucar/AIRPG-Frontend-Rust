import React from 'react';
import styles from '../style.module.css';

export function SearchBar() {
  return (
    <div className={styles.searchContainer}>
      <input 
        type="text" 
        placeholder="Pesquisar..." 
        className={styles.searchInput}
      />
    </div>
  );
}