import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Import your character PNGs (place them in src/assets or public folder)
import AaronImg from "/assets/aaron.png";
import EaterImg from "/assets/flytrap-mob-pixilart.png";

function MenuScreen() {
  const navigate = useNavigate();
  const [showCharacters, setShowCharacters] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 text-center px-4">
      <h1 className="text-5xl font-bold mb-4">🌱 Waste Warfare</h1>
      
      <p className="text-lg text-gray-700 max-w-xl mb-8">
        Welcome to <span className="font-semibold">Waste Warfare</span> — a fun and fast-paced tower defense game where you defend the environment from incoming waves of pollution! Place defenders like Aaron and the mighty Eater to stop the trash before it reaches your base. Good luck, eco-warrior! 💪🌍
      </p>

      <div className="flex gap-4 mb-8">
        <button
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-xl shadow-md transition-transform transform hover:scale-105"
          onClick={() => navigate("/game")}
        >
          Play
        </button>
        <button
          className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 py-3 px-6 rounded-lg text-xl shadow-md transition-transform transform hover:scale-105"
          onClick={() => setShowCharacters(!showCharacters)}
        >
          {showCharacters ? "Hide Characters" : "Characters"}
        </button>
      </div>

      {showCharacters && (
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl text-left space-y-6 text-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-center">Meet Your Defenders</h2>
          
          {/* Character: Aaron */}
          <div className="flex items-center gap-4">
            <img src={AaronImg} alt="Aaron" className="w-20 h-20 rounded-full border border-gray-300" />
            <div>
              <h3 className="text-xl font-semibold">🧍 Aaron</h3>
              <p>A quick and reliable recycler who tosses plastic and cans into the bin with precision. Great for dealing with fast trash!</p>
            </div>
          </div>

          {/* Character: The Eater */}
          <div className="flex items-center gap-4">
            <img src={EaterImg} alt="The Eater" className="w-20 h-20 rounded-full border border-gray-300" />
            <div>
              <h3 className="text-xl font-semibold">🦠 The Eater</h3>
              <p>A powerful bio-defender that devours waste in large chunks. Slower, but hits hard and has area effects.</p>
            </div>
          </div>

          {/* Add more character sections as needed */}
        </div>
      )}
    </div>
  );
}

export default MenuScreen;