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
import { Paperclip, Send, MoreVertical, ArrowLeft, X } from "lucide-react";

// Format time: 3:45 PM
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

// Format date label: Today, Yesterday, or 15-12-2025
const formatMessageDate = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
};

// Format last seen (WhatsApp style)
const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return "last seen recently";

  const lastSeen = new Date(lastSeenDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const lastSeenDay = new Date(lastSeen.getFullYear(), lastSeen.getMonth(), lastSeen.getDate());
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  const timeStr = lastSeen.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (lastSeenDay.getTime() === today.getTime()) {
    return `last seen today at ${timeStr}`;
  } else if (lastSeenDay.getTime() === yesterday.getTime()) {
    return `last seen yesterday at ${timeStr}`;
  } else {
    const dateStr = lastSeen.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
    return `last seen ${dateStr} at ${timeStr}`;
  }
};

// Skeleton Components
const SkeletonMessage = ({ isSent }) => (
  <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
    <div className="max-w-xs lg:max-w-md">
      <div
        className={`p-4 rounded-2xl shadow animate-pulse ${
          isSent ? "bg-indigo-200 rounded-br-none" : "bg-gray-200 rounded-bl-none"
        }`}
      >
        <div className="h-4 bg-gray-300 rounded w-48"></div>
        <div className="h-4 bg-gray-300 rounded w-32 mt-2"></div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
        {isSent && <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>}
      </div>
    </div>
  </div>
);

const SkeletonHeader = () => (
  <div className="flex items-center h-16 px-3 sm:px-6 animate-pulse">
    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
    <div className="ml-3 flex-1">
      <div className="h-4 bg-gray-300 rounded w-32"></div>
      <div className="h-3 bg-gray-300 rounded w-24 mt-2"></div>
    </div>
  </div>
);

const DateDivider = ({ label }) => (
  <div className="flex items-center my-6">
    <div className="flex-1 border-t border-gray-300"></div>
    <span className="px-4 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
      {label}
    </span>
    <div className="flex-1 border-t border-gray-300"></div>
  </div>
);

const Chat = ({ selectedUser, setSidebarOpen }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null); // Message being replied to
  const [openMenuId, setOpenMenuId] = useState(null);
  const [liveUser, setLiveUser] = useState(selectedUser);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  if (!currentUser || !selectedUser) return null;

  const chatId = [currentUser.uid, selectedUser.id].sort().join("_");

  // Live user status
  useEffect(() => {
    setLiveUser(selectedUser);
    setLoading(true);

    const userRef = doc(db, "users", selectedUser.id);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const lastSeen = data.lastSeen?.toDate?.() ?? (data.lastSeen ? new Date(data.lastSeen) : null);

      setLiveUser((prev) => ({
        ...prev,
        online: data.online || false,
        lastSeen,
        statusText: data.online
          ? "Active now"
          : lastSeen
          ? formatLastSeen(lastSeen)
          : "last seen recently",
      }));
    });

    return unsub;
  }, [selectedUser.id]);

  // Load messages
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
        setMessages(msgs);
        setLoading(false);

        // Notify on newly added messages (not sent by current user)
        try {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const m = { id: change.doc.id, ...change.doc.data() };
              if (m.senderId !== currentUser.uid) {
                const pageVisible = document.visibilityState === "visible";
                // Only notify when page not visible (or you can always notify)
                if (!pageVisible) {
                  const title = selectedUser.displayName || "New message";
                  const options = {
                    body: m.text || "New message",
                    icon: selectedUser.photoURL || "/live-chat/favicon.ico",
                    tag: `chat-${chatId}`,
                    renotify: true,
                  };

                  // Prefer Service Worker notification if available
                  if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistration) {
                    navigator.serviceWorker.getRegistration().then((reg) => {
                      if (reg && reg.showNotification) {
                        reg.showNotification(title, options);
                      } else if (Notification.permission === "granted") {
                        new Notification(title, options);
                      }
                    }).catch(() => {
                      if (Notification.permission === "granted") new Notification(title, options);
                    });
                  } else {
                    if (Notification.permission === "granted") new Notification(title, options);
                  }
                }
              }
            }
          });
        } catch (err) {
          // ignore notification errors
          console.error("Notification error:", err);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    return unsub;
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        Notification.requestPermission().then((perm) => {
          console.log("Notification permission:", perm);
        });
      } catch (e) {
        // Some browsers may throw for requestPermission
      }
    }
  }, []);

  // Send message (with optional reply)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    };

    if (replyTo) {
      messageData.replyTo = {
        messageId: replyTo.id,
        text: replyTo.text,
        senderId: replyTo.senderId,
      };
    }

    await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    setNewMessage("");
    setReplyTo(null);
  };

  const deleteMessage = async (msgId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
    setOpenMenuId(null);
  };

  const startReply = (msg) => {
    setReplyTo(msg);
  };

  const cancelReply = () => setReplyTo(null);

  // Reply Preview Component (inside Chat to access currentUser & liveUser)
  const ReplyPreview = () => {
    if (!replyTo) return null;

    const isOwn = replyTo.senderId === currentUser.uid;

    return (
      <div className="bg-gray-100 border-l-4 border-indigo-600 px-4 py-3 flex items-center gap-3 text-sm">
        <div className="flex-1">
          <p className="text-indigo-600 font-medium">
            Replying to {isOwn ? "yourself" : liveUser.displayName}
          </p>
          <p className="text-gray-700 truncate max-w-md">{replyTo.text}</p>
        </div>
        <button onClick={cancelReply} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderMessagesWithDividers = () => {
    if (messages.length === 0) return null;

    let lastDate = null;
    const result = [];

    messages.forEach((msg) => {
      const msgDate = formatMessageDate(msg.timestamp);
      if (msgDate && msgDate !== lastDate) {
        result.push(<DateDivider key={`divider-${msgDate}`} label={msgDate} />);
        lastDate = msgDate;
      }

      const isRepliedTo = replyTo?.id === msg.id;

      result.push(
        <div
          key={msg.id}
          className={`flex ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}
        >
          <div className={`max-w-xs lg:max-w-md relative ${isRepliedTo ? "animate-pulse" : ""}`}>
            {/* Highlight bar if this message was replied to */}
            {/* {msg.replyTo && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-full -ml-2"></div>
            )} */}

            <div
              className={`relative p-4 rounded-2xl shadow cursor-pointer transition-all
                ${msg.senderId === currentUser.uid
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-white rounded-bl-none"
                }
                ${isRepliedTo ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-50" : ""}
                hover:brightness-95
              `}
              onClick={() => startReply(msg)}
            >
              {/* Quoted reply inside message */}
              {msg.replyTo && (
                <div className={`mb-3 p-2 rounded text-xs opacity-90 border-l-4 ${
                  msg.senderId === currentUser.uid
                    ? "bg-indigo-700 border-indigo-400"
                    : "bg-gray-100 border-gray-400"
                }`}>
                  <p className="font-medium">
                    {msg.replyTo.senderId === currentUser.uid ? "You" : liveUser.displayName}
                  </p>
                  <p className="truncate">{msg.replyTo.text}</p>
                </div>
              )}

              <p className="text-sm break-words">{msg.text}</p>
            </div>

            <div className="flex items-center justify-between mt-2 gap-2">
              <p className={`text-xs ${msg.senderId === currentUser.uid ? "text-gray-200" : "text-gray-500"}`}>
                {msg.timestamp ? formatTime(msg.timestamp) : ""}
              </p>

              {msg.senderId === currentUser.uid && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                    }}
                    className="p-1 rounded hover:bg-indigo-500/20 transition"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-300" />
                  </button>
                  {openMenuId === msg.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(msg.id);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium transition"
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
      );
    });

    return result;
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        {loading ? (
          <SkeletonHeader />
        ) : (
          <div className="flex items-center h-16 px-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="mr-2 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            <img className="w-10 h-10 rounded-full" src={liveUser.photoURL} alt="" />
            <div className="ml-3">
              <h3 className="font-semibold text-sm">{liveUser.displayName}</h3>
              <p className={`text-xs capitalize ${liveUser.online ? "text-green-600" : "text-gray-500"}`}>
                {liveUser.statusText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 pb-28 sm:pb-6">
        {loading ? (
          <>
            <SkeletonMessage isSent={false} />
            <SkeletonMessage isSent={true} />
            <SkeletonMessage isSent={false} />
            <SkeletonMessage isSent={true} />
            <SkeletonMessage isSent={false} />
          </>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          renderMessagesWithDividers()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview + Input */}
      <div className="bg-white border-t">
        <ReplyPreview />
        <form onSubmit={sendMessage} className="p-3 sm:p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button type="button" className="p-2 rounded-full hover:bg-gray-100">
              <Paperclip className="w-6 h-6 text-gray-600" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyTo ? `Replying to ${replyTo.senderId === currentUser.uid ? "yourself" : liveUser.displayName}...` : "Type a message..."}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="bg-indigo-600 text-white rounded-full p-3 shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;