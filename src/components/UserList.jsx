import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);

    const updateStatus = async (isOnline) => {
      try {
        // First check if document exists
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          // Create document if it doesn't exist
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName:
              currentUser.displayName || `User-${currentUser.uid.slice(0, 4)}`,
            photoURL: currentUser.photoURL || null,
            email: currentUser.email || null,
            online: isOnline,
            lastSeen: serverTimestamp(),
          });
        } else {
          // Update existing document
          await setDoc(
            userRef,
            {
              online: isOnline,
              lastSeen: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.error("Status update error:", err);
        setError("Failed to update status");
      }
    };

    // Set online status when component mounts
    updateStatus(true);

    // Set up event listeners for window/tab closing
    const handleBeforeUnload = async () => {
      await updateStatus(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Handle browser tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateStatus(false);
      } else {
        updateStatus(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Cleanup
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateStatus(false);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "users")
        // where('online', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const usersData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Include all users except current user
            if (doc.id !== currentUser.uid) {
              const date = data.lastSeen?.toDate();
              const options = {
                month: "short",
                day: "2-digit",
                year: "numeric",
              };
              //if last seen today
              const today = new Date();
              const todayFormatted = today
                .toLocaleDateString("en-US", options)
                .replace(",", "")
                .trim();
              const lastSeenFormatted = date
                .toLocaleString("en-US", options)
                .replace(",", "")
                .trim();
              let lastSeenIsToday = todayFormatted === lastSeenFormatted;
              // End the condition
              usersData.push({
                id: doc.id,
                ...data,
                lastSeen:
                data.lastSeen?.toDate()?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }).toLowerCase() || "just now",
                lastSeenDayLong: date.toLocaleString("en-US", options),
                lastSeenIsToday,
              });
            }
          });

          setUsers(usersData);
          setLoading(false);
        },
        (err) => {
          setError("Failed to load users");
          setLoading(false);
          console.error("Snapshot error:", err);
        }
      );

      return unsubscribe;
    } catch (err) {
      setError("Error setting up query");
      setLoading(false);
      console.error("Setup error:", err);
    }
  }, [currentUser]);

  if (error) {
    return (
      <div className="user-list error">
        <h3>All Users</h3>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="user-list">
        <h3>All Users</h3>
        <div className="login-prompt">Sign in to see who's online</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-list loading">
        <h3>All Users</h3>
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="user-list">
      <h3>Online Users ({users.length})</h3>
      <div className="user-scroll-container">
        {users.length === 0 ? (
          <div className="no-users">No other users online</div>
        ) : (
          <ul className="user-items">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div className="avatar-container">
                  <img
                    src={user.photoURL || "https://i.imgur.com/6VBx3io.png"}
                    alt={user.displayName}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://i.imgur.com/6VBx3io.png";
                    }}
                  />
                  <span
                    className={`status-dot ${
                      user.online ? "online" : "offline"
                    }`}
                  />
                </div>
                <div className="user-details">
                  <span className="user-name">{user.displayName}</span>
                  {user.online ? (
                    <span className="green-dot"></span>
                  ) : (
                    <span className="red-dot"></span>
                  )}
                  <span className="user-status">
                    {user.online
                      ? "Online"
                      : `Last seen ${
                          user.lastSeenIsToday
                            ? "Today at " + user.lastSeen
                            : user.lastSeenDayLong +' '+ user.lastSeen
                        }`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserList;
