import { FC, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import styles from './UseInvitePage.module.scss';

/**
 * UseInvitePage - Create account and join via invite link
 * Route: /j/:userInviteCode? or /j
 */
const UseInvitePage: FC = () => {
  const { userInviteCode } = useParams<{ userInviteCode?: string }>();
  const navigate = useNavigate();
  
  // Form state
  const [inviteCode, setInviteCode] = useState(userInviteCode || '');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  
  // Form error and loading
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateUsername = (value: string): string => {
    if (!value) return 'Username is required';
    // Only allow lowercase letters, numbers, dash, underscore, period
    if (!/^[a-z0-9\-_.]*$/.test(value)) {
      return 'Username can only contain lowercase letters, numbers, dash, underscore, or period';
    }
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value) return 'Email is required';
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePasswordMatch = (pwd: string, repeatPwd: string): string => {
    if (!pwd) return 'Password is required';
    if (!repeatPwd) return 'Please repeat your password';
    if (pwd !== repeatPwd) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePasswordMatch(password, repeatPassword);
    
    // Show first error found
    if (usernameError) {
      setFormError(usernameError);
      return;
    }
    if (emailError) {
      setFormError(emailError);
      return;
    }
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (!inviteCode.trim()) {
      setFormError('Invite code is required');
      return;
    }
    
    // Submit form
    try {
      setLoading(true);
      // First, use the invite to create the account
      await ApiService.useUserInvite(
        inviteCode,
        name,
        username,
        email,
        password
      );
      // Then, log in with the credentials
      await ApiService.login({
        username,
        password,
      });
      // On success, navigate to dashboard
      navigate('/');
    } catch (error) {
      // Parse error message from API
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Map specific error conditions
        if (message.includes('invalid or expired')) {
          errorMessage = 'This invite code is invalid, expired, or has already been used.';
        } else if (message.includes('unique constraint')) {
          if (message.includes('username')) {
            errorMessage = 'This username is already taken.';
          } else if (message.includes('email')) {
            errorMessage = 'This email is already registered.';
          } else {
            errorMessage = 'This account information is already in use.';
          }
        } else if (message.includes('invite')) {
          errorMessage = 'This invite code is invalid or has already been used.';
        } else if (message.includes('api error')) {
          errorMessage = error.message;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Ultimate TicTacToe</h1>
          <p className={styles.subtitle}>Join the game</p>
        </header>

        <main className={styles.main}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Form-level error message */}
            {formError && (
              <div className={styles.errorBox}>
                {formError}
              </div>
            )}

            {/* Invite Code */}
            <div className={styles.formGroup}>
              <label htmlFor="inviteCode" className={styles.label}>
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                className={styles.input}
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={!!userInviteCode}
              />
            </div>

            {/* Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Username */}
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Repeat Password */}
            <div className={styles.formGroup}>
              <label htmlFor="repeatPassword" className={styles.label}>
                Repeat Password
              </label>
              <input
                id="repeatPassword"
                type="password"
                className={styles.input}
                placeholder="Repeat password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account & Join'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default UseInvitePage;
