import { AuthProvider } from './context/AuthContext';
import Chat from './components/Chat';
import UserList from './components/UserList';
import AuthButtons from './components/AuthButtons';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <header>
          <h1>Chat</h1>
          <AuthButtons />
        </header>
        <main>
          <UserList />
          <Chat />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;