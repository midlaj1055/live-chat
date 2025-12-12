// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Paperclip, Send, MoreVertical } from "lucide-react";

const Chat = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [liveUser, setLiveUser] = useState(selectedUser);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  const chatId = [currentUser.uid, selectedUser.id].sort().join("_");

  // Subscribe to real-time user status updates
  useEffect(() => {
    const userRef = doc(db, "users", selectedUser.id);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        const lastSeen = userData.lastSeen?.toDate();
        const time = lastSeen
          ? lastSeen.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          : "just now";

        setLiveUser({
          ...selectedUser,
          online: userData.online,
          lastSeenTime: lastSeen ? (new Date().toDateString() === lastSeen.toDateString() ? `Today at ${time}` : time) : "Offline",
        });
      }
    });

    return unsubscribe;
  }, [selectedUser.id]);

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const deleteMessage = async (msgId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 bg-white border-b">
        <div className="flex items-center">
          <img className="w-10 h-10 rounded-full" src={liveUser.photoURL} alt="" />
          <div className="ml-3">
            <h3 className="font-semibold">{liveUser.displayName}</h3>
            <p className={`text-xs ${liveUser.online ? "text-green-600" : "text-gray-500"}`}>
              {liveUser.online ? "Active now" : `Last seen ${liveUser.lastSeenTime || "offline"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-xs lg:max-w-md`}>
              <div
                className={`p-4 rounded-2xl shadow ${
                  msg.senderId === currentUser.uid
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className={`text-xs ${msg.senderId === currentUser.uid ? "text-black-200" : "text-gray-500"}`}>
                    {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                  {msg.senderId === currentUser.uid && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                        className={`p-1 rounded transition ${msg.senderId === currentUser.uid ? "text-indigo-500 hover:text-indigo-900" : ""}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === msg.id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => {
                              deleteMessage(msg.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex items-center space-x-3">
          <button type="button">
            <Paperclip className="w-6 h-6 text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit">
            <Send className="w-6 h-6 text-indigo-600" />
          </button>
        </div>
      </form>
    </>
  );
};

export default Chat;