// src/components/UserList.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, serverTimestamp, getDoc, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Search, Circle } from "lucide-react";

const UserList = ({ selectedUser, setSelectedUser, setSidebarOpen }) => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const updateOnline = async (online) => {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName: currentUser.displayName || "User",
          photoURL: currentUser.photoURL || "https://i.imgur.com/6VBx3io.png",
          online,
          lastSeen: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, { online, lastSeen: serverTimestamp() }, { merge: true });
      }
    };

    updateOnline(true);
    const handleVisibility = () => updateOnline(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", () => updateOnline(false));

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      updateOnline(false);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        if (doc.id === currentUser.uid) return;
        const data = doc.data();
        const lastSeen = data.lastSeen?.toDate();
        const time = lastSeen
          ? lastSeen.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          : "just now";

        list.push({
          id: doc.id,
          ...data,
          lastSeenTime: lastSeen ? (new Date().toDateString() === lastSeen.toDateString() ? `Today at ${time}` : time) : "Offline",
        });
      });
      setUsers(list);
    });

    return unsubscribe;
  }, [currentUser]);

  if (!currentUser) return <div className="p-8 text-center text-gray-500">Login to see users</div>;

  return (
    <>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search people..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => {
              setSelectedUser(user);
              setSidebarOpen(false);
            }}
            className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition ${
              selectedUser?.id === user.id ? "bg-indigo-50" : ""
            }`}
          >
            <div className="relative">
              <img
                className="w-12 h-12 rounded-full object-cover"
                src={user.photoURL || "https://i.imgur.com/6VBx3io.png"}
                alt={user.displayName}
              />
              {user.online ? (
                <Circle className="absolute bottom-0 right-0 w-4 h-4 fill-green-500 text-green-500 border-2 border-white rounded-full" />
              ) : (
                <Circle className="absolute bottom-0 right-0 w-4 h-4 fill-gray-400 text-gray-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">{user.displayName || "User"}</h3>
                <span className="text-xs text-gray-500">{user.online ? "Online" : user.lastSeenTime}</span>
              </div>
              <p className="text-sm text-gray-500">
                {user.online ? "Active now" : `Last seen ${user.lastSeenTime}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default UserList;