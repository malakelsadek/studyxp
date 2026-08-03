import { PhaserGame } from "./game/PhaserGame";
import { useSocket } from "./useSocket";
import "./App.css";

function App() {
  const { connected, lastPong, ping } = useSocket();

  return (
    <div className="app">
      <div className="status-bar">
        <span>Server: {connected ? "connected" : "disconnected"}</span>
        <button onClick={ping} disabled={!connected}>
          Ping server
        </button>
        {lastPong && <span>{lastPong}</span>}
      </div>
      <PhaserGame />
    </div>
  );
}

export default App;
