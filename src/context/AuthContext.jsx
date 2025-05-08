import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from '../firebase'; // Make sure your firebase.js exports these correctly

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  function loginWithPhone(phoneNumber) {
    // Ensure reCAPTCHA is initialized
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha-container', // This is where the reCAPTCHA will render
        {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA resolved');
          },
        },
        auth // Pass the auth instance here
      );
    }

    const appVerifier = window.recaptchaVerifier;

    return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((result) => {
        setConfirmationResult(result); // Store the confirmation result
      })
      .catch((error) => {
        console.error('SMS not sent', error);
        throw error;
      });
  }

  function verifyOTP(otp) {
    if (!confirmationResult) {
      throw new Error('No confirmation result found. Call loginWithPhone first.');
    }

    return confirmationResult
      .confirm(otp)
      .then((result) => {
        setCurrentUser(result.user);
        return result.user;
      })
      .catch((error) => {
        console.error('Invalid OTP', error);
        throw error;
      });
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithPhone,
    verifyOTP,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
