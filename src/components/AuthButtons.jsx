import { useAuth } from '../context/AuthContext';

const AuthButtons = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();

  return (
    <div className="auth-buttons">
      {currentUser ? (
        <>
          <span>Welcome, {currentUser.displayName || 'User'}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={loginWithGoogle}>Login with Google</button>
      )}
    </div>
  );
};

export default AuthButtons;