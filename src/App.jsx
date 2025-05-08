import { AuthProvider } from "./context/AuthContext";
import Chat from "./components/Chat";
import UserList from "./components/UserList";
import AuthButtons from "./components/AuthButtons";
import "./App.css";
import { useState } from "react";

function App() {
  const [menuOpen,setMenuOPen]= useState(false);
  return (
    <AuthProvider>
      <div className="app">
        <header>
          <h1>Chat</h1>
          <AuthButtons />
        </header>
        <main>
          <button className="toggle-btn" onClick={()=>setMenuOPen(!menuOpen)}>
            {!menuOpen?
            '|||'
            :  
            'X'
          }
            </button>
        <div className={`toggle-menu ${menuOpen ? "active" : ""}`}>
            <UserList />
          </div>
          <Chat />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
