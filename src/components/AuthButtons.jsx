// src/components/AuthButtons.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";

const AuthButtons = () => {
  const { currentUser, loginWithGoogle, loginWithPhone, verifyOTP, logout } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handlePhoneLogin = async () => {
    try {
      await loginWithPhone(phone);
      setIsOtpSent(true);
    } catch (error) {
      alert("Failed to send OTP. Check console.");
      console.error(error);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await verifyOTP(otp);
      setIsOtpSent(false);
      setOtp("");
    } catch (error) {
      alert("Invalid OTP");
      console.error(error);
    }
  };

  if (currentUser) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <img
            src={currentUser.photoURL || "https://i.imgur.com/6VBx3io.png"}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentUser.displayName || currentUser.phoneNumber || "User"}
            </p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <button
        onClick={loginWithGoogle}
        className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center space-x-3 transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium">Sign in with Google</span>
      </button>

      <div className="space-y-3">
        <input
          type="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handlePhoneLogin}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Send OTP
        </button>

        {isOtpSent && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg tracking-widest"
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Verify & Login
            </button>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthButtons;