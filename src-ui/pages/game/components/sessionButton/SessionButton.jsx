import styles from './SessionButtonStyle.module.css';

export function SessionButton({ title, icon, onClick }) {
    return (
        <button 
            type="button" 
            className={styles.buttonContainer} 
            onClick={onClick}
        >
            <img className={styles.icon} src={icon} alt={title}/>
            <span className={styles.label}>
                {title}
            </span>
        </button>
    );
}