import styles from './UserMessageStyle.module.css';

export function UserMessage({ text, label = "VOCÊ DIZ" }) {
    return (
        <div className={styles.container}>
            <div className={styles.bubble}>
                <span className={styles.messageText}>
                    {text}
                </span>
                
                <div className={styles.labelContainer}>
                    <span className={styles.labelText}>
                        {label}
                    </span>
                </div>
            </div>
        </div>
    );
}