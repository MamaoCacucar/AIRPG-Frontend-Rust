import styles from './Metadata.module.css';
import rayIcon from '/src-ui/assets/icons/ray.svg';

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minuteText = `${minutes} minuto${minutes === 1 ? '' : 's'}`;
  const secondText = `${seconds} segundo${seconds === 1 ? '' : 's'}`;

  return minutes > 0 ? `${minuteText} e ${secondText}` : secondText;
}

export function Metadata({ status }) {
  if (!status?.message) {
    return null;
  }

  const isComplete = status.phase === 'complete';
  const isError = status.phase === 'error';
  const elapsed = status.elapsedMs ?? (
    status.startedAt ? Date.now() - status.startedAt : null
  );
  const message = isComplete && elapsed !== null
    ? `Rodada gerada em ${formatDuration(elapsed)}`
    : status.message;

  return (
    <div
      className={`${styles.metadata} ${isError ? styles.error : ''}`}
      role="status"
      aria-live="polite"
    >
      {isComplete ? (
        <img className={styles.icon} src={rayIcon} alt="" aria-hidden="true" />
      ) : isError ? null : (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}
