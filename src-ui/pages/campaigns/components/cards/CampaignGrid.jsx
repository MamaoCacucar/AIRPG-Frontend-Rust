import React from 'react';
import styles from './CampaignCardStyle.module.css';

export function CampaignGrid({ children, customLayout }) {
  // Conta o número de cards reais passados
  const childrenArray = React.Children.toArray(children).filter(React.isValidElement);
  const count = childrenArray.length;

  return (
    <div className={styles.gridContainer}>
      {childrenArray.map((child, index) => {
        
        // Define o span de colunas e linhas dinamicamente
        let gridClasses = styles.gridItemDefault;

        if (customLayout && customLayout[index]) {
          // Usa o layout manual se fornecido para o índice atual
          gridClasses = customLayout[index];
        } else if (count === 2) {
          // 2 Cards: 60% / 40%
          gridClasses = index === 0 ? styles.gridItem2_0 : styles.gridItem2_1;
        } else if (count === 3) {
          // 3 Cards: Metade pro 1º, e o restante divide a outra metade verticalmente
          if (index === 0) gridClasses = styles.gridItem3_0;
          else gridClasses = styles.gridItem3_1;
        } else if (count >= 4) {
          // 4 Cards (Layout do Figma/Contexto)
          if (index === 0) gridClasses = styles.gridItem4_0;
          else if (index === 1) gridClasses = styles.gridItem4_1;
          else gridClasses = styles.gridItem4_2;
        }

        // Injeta a prop `isMain` no primeiro elemento automaticamente e as classes de grid
        return React.cloneElement(child, {
          className: `${styles.gridItem} ${gridClasses} ${child.props.className || ''}`.trim(),
          isMain: index === 0 
        });
      })}
    </div>
  );
}