import { FC } from 'react';
import styles from './ErrorModal.module.scss';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: FC<ErrorModalProps> = ({ message, onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.icon}>✕</div>
          <h2>Error</h2>
          <p>{message}</p>
        </div>
        <button
          className={styles.button}
          onClick={onClose}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
