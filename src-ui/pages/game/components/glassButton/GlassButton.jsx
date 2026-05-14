import styles from './GlassButtonStyle.module.css';

export const GlassButton = ({ children, onClick, ariaLabel }) => {
    return (
        <button 
            className={styles.glassButton} 
            onClick={onClick} 
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
};