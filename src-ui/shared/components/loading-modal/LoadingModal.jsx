import styles from './LoadingModal.module.css';

export function LoadingModal({ message = 'Carregando...' }) {
  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={message}
      >
        <span className={styles.spinner} aria-hidden="true" />
        <p className={styles.message} aria-live="polite">{message}</p>
      </div>
    </div>
  );
}
