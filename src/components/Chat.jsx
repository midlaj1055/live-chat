// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Paperclip, Send, MoreVertical, ArrowLeft } from "lucide-react";

const formatTimestamp = (ts) => {
  if (!ts) return "";
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Chat = ({ selectedUser, setSidebarOpen }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [liveUser, setLiveUser] = useState(selectedUser);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  if (!currentUser || !selectedUser) return null;

  const chatId = [currentUser.uid, selectedUser.id].sort().join("_");

  useEffect(() => {
    setLiveUser(selectedUser);
    const userRef = doc(db, "users", selectedUser.id);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const lastSeen = data.lastSeen?.toDate?.() ?? (data.lastSeen ? new Date(data.lastSeen) : null);
      const time = lastSeen
        ? lastSeen.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "just now";

      setLiveUser((prev) => ({
        ...prev,
        online: data.online,
        lastSeenTime: lastSeen
          ? (new Date().toDateString() === lastSeen.toDateString() ? `Today at ${time}` : time)
          : "Offline",
      }));
    });

    return unsub;
  }, [selectedUser.id]);

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return unsub;
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
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center h-16 px-3 sm:px-6">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="mr-2 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Open users"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <img className="w-10 h-10 rounded-full" src={liveUser.photoURL} alt="" />
          <div className="ml-3">
            <h3 className="font-semibold text-sm">{liveUser.displayName}</h3>
            <p className={`text-xs ${liveUser.online ? "text-green-600" : "text-gray-500"}`}>
              {liveUser.online ? "Active now" : `Last seen ${liveUser.lastSeenTime || "offline"}`}
            </p>
          </div>
        </div>
      </div>
 
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 pb-28 sm:pb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-xs lg:max-w-md`}>
              <div
                className={`p-4 rounded-2xl shadow ${
                  msg.senderId === currentUser.uid ? "bg-indigo-600 text-white rounded-br-none" : "bg-white rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className={`text-xs ${msg.senderId === currentUser.uid ? "text-indigo-100" : "text-gray-500"}`}>
                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ""}
                  </p>
                  {msg.senderId === currentUser.uid && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                        className="p-1 rounded hover:bg-indigo-500/10 transition"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === msg.id}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      {openMenuId === msg.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                          <button
                            onClick={() => {
                              deleteMessage(msg.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-tl-lg rounded-tr-lg text-sm font-medium transition"
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
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t sm:static sm:border-t sm:p-4"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100">
            <Paperclip className="w-6 h-6 text-gray-600" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-full p-3 shadow-md hover:bg-indigo-700 transition"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;