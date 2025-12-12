// src/App.jsx
import { useState } from "react";
import UserList from "./components/UserList";
import Chat from "./components/Chat";
import AuthButtons from "./components/AuthButtons";
import { Menu, X } from "lucide-react";

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 lg:w-96 bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-900 text-white">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b">
          <AuthButtons />
        </div>

        <UserList
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <Chat selectedUser={selectedUser} setSidebarOpen={setSidebarOpen} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-4">Welcome to Chat</p>
              <p>Select a user to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;