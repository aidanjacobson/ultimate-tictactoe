import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SuccessModal.module.scss';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

const SuccessModal: FC<SuccessModalProps> = ({ message, onClose }) => {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.icon}>✓</div>
          <h2>Success!</h2>
          <p>{message}</p>
        </div>
        <button
          className={styles.button}
          onClick={handleReturnToDashboard}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
