import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthButtons = () => {
  const { currentUser, loginWithGoogle, loginWithPhone, verifyOTP, logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handlePhoneLogin = async () => {
    try {
      await loginWithPhone(phone);
      setIsOtpSent(true);
    } catch (error) {
      console.error("Error during phone login:", error);
    }
  };

  const handleOtpVerify = async () => {
    try {
      const user = await verifyOTP(otp);
      console.log('Logged in as', user.phoneNumber);
    } catch (error) {
      console.error('Error during OTP verification:', error);
    }
  };

  return (
    <div className="auth-buttons">
      {currentUser ? (
        <>
          <span>Welcome, {currentUser.displayName || currentUser.phoneNumber || 'User'}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={loginWithGoogle}>Login with Google</button>
          <div>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={handlePhoneLogin}>Send OTP</button>
          </div>
          {isOtpSent && (
            <div>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={handleOtpVerify}>Verify OTP</button>
            </div>
          )}
        </>
      )}
      <div id="recaptcha-container"></div> {/* reCAPTCHA container */}
    </div>
  );
};

export default AuthButtons;
