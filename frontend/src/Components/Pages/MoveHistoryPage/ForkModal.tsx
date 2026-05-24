import { FC, useState, useEffect, useMemo } from 'react';
import ApiService from '../../../services/ApiService';
import type { GameResponse } from '../../../datamodels/tictactoe';
import type { UserResponse } from '../../../datamodels/users';
import styles from './ForkModal.module.scss';

interface ForkModalProps {
  game: GameResponse;
  stepIndex: number;
  totalMoves: number;
  onConfirm: (xUserId: number, oUserId: number) => void;
  onClose: () => void;
  loading: boolean;
}

type Slot = 'x' | 'o';

const ForkModal: FC<ForkModalProps> = ({ game, stepIndex, totalMoves, onConfirm, onClose, loading }) => {
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [xPlayer, setXPlayer] = useState<UserResponse | null>(null);
  const [oPlayer, setOPlayer] = useState<UserResponse | null>(null);

  const [openPicker, setOpenPicker] = useState<Slot | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [me, users] = await Promise.all([ApiService.validate(), ApiService.getUsers()]);
        setCurrentUser(me);
        setAllUsers(users);

        // Default to the game's original players
        const xUser = users.find(u => u.id === game.x_user_id) ?? null;
        const oUser = users.find(u => u.id === game.o_user_id) ?? null;
        setXPlayer(xUser);
        setOPlayer(oUser);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [game.x_user_id, game.o_user_id]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  const validationError = useMemo(() => {
    if (!xPlayer || !oPlayer) return 'Both players must be selected.';
    if (xPlayer.id === oPlayer.id) return 'X and O must be different players.';
    if (!currentUser) return null;
    if (currentUser.id !== xPlayer.id && currentUser.id !== oPlayer.id) {
      return 'You must be one of the players (X or O).';
    }
    return null;
  }, [xPlayer, oPlayer, currentUser]);

  const stepLabel = stepIndex === 0
    ? 'the start of the game'
    : stepIndex === totalMoves
      ? `move ${stepIndex} (end)`
      : `move ${stepIndex} of ${totalMoves}`;

  const selectUser = (slot: Slot, user: UserResponse) => {
    if (slot === 'x') setXPlayer(user);
    else setOPlayer(user);
    setOpenPicker(null);
    setSearch('');
  };

  const togglePicker = (slot: Slot) => {
    setOpenPicker(prev => prev === slot ? null : slot);
    setSearch('');
  };

  const renderSlot = (slot: Slot, player: UserResponse | null, otherPlayer: UserResponse | null) => {
    const label = slot === 'x' ? 'X' : 'O';
    const isOpen = openPicker === slot;

    return (
      <div className={styles.slot}>
        <div className={styles.slotHeader}>
          <span className={`${styles.slotLabel} ${slot === 'x' ? styles.slotLabelX : styles.slotLabelO}`}>
            {label}
          </span>
          <button
            className={styles.slotButton}
            onClick={() => togglePicker(slot)}
            disabled={loading}
          >
            {player ? (
              <>
                <span className={styles.slotName}>{player.name}</span>
                <span className={styles.slotUsername}>@{player.username}</span>
              </>
            ) : (
              <span className={styles.slotEmpty}>Select a player…</span>
            )}
            <span className={styles.slotChevron}>{isOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {isOpen && (
          <div className={styles.picker}>
            <input
              className={styles.search}
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className={styles.pickerList}>
              {filteredUsers.length === 0 ? (
                <p className={styles.pickerEmpty}>No users found</p>
              ) : (
                filteredUsers.map(user => {
                  const isOther = otherPlayer?.id === user.id;
                  const isCurrent = currentUser?.id === user.id;
                  const isSelected = player?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      className={`${styles.pickerUser} ${isSelected ? styles.pickerUserSelected : ''}`}
                      onClick={() => selectUser(slot, user)}
                      disabled={loading}
                    >
                      <span className={styles.pickerName}>{user.name}</span>
                      <span className={styles.pickerMeta}>
                        @{user.username}
                        {isCurrent && <span className={styles.badge}>you</span>}
                        {isOther && <span className={styles.badgeConflict}>already {slot === 'x' ? 'O' : 'X'}</span>}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Fork Game</h2>
          <p className={styles.subtitle}>Starting from {stepLabel}</p>
        </div>

        <div className={styles.body}>
          {loadingUsers ? (
            <p className={styles.loadingMsg}>Loading players…</p>
          ) : (
            <>
              {renderSlot('x', xPlayer, oPlayer)}
              {renderSlot('o', oPlayer, xPlayer)}
            </>
          )}
        </div>

        {validationError && !loadingUsers && (
          <div className={styles.validationError}>{validationError}</div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={() => xPlayer && oPlayer && onConfirm(xPlayer.id, oPlayer.id)}
            disabled={loading || loadingUsers || !!validationError}
          >
            {loading ? 'Forking…' : 'Fork Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForkModal;
