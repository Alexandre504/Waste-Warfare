import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MenuScreen from "./components/MenuScreen";
import GameCanvas from "./components/GameCanvas";
import VictoryScreen from "./components/VictoryScreen";
import DefeatScreen from "./components/DefeatScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/game" element={<GameCanvas />} />
        <Route path="/victory" element={<VictoryScreen />} />
        <Route path="/defeat" element={<DefeatScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
