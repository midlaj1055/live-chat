// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Paperclip, Send } from "lucide-react";

const Chat = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  const chatId = [currentUser.uid, selectedUser.id].sort().join("_");

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
          <img className="w-10 h-10 rounded-full" src={selectedUser.photoURL} alt="" />
          <div className="ml-3">
            <h3 className="font-semibold">{selectedUser.displayName}</h3>
            <p className={`text-xs ${selectedUser.online ? "text-green-600" : "text-gray-500"}`}>
              {selectedUser.online ? "Active now" : `Last seen ${selectedUser.lastSeenTime || "offline"}`}
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
              {msg.senderId === currentUser.uid && (
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="text-xs text-red-500 mt-1"
                >
                  Delete
                </button>
              )}
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