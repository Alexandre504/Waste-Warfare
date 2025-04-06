import { useNavigate } from "react-router-dom";

function MenuScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
      <h1 className="text-5xl font-bold mb-6">🌱 Waste Warfare</h1>
      <button
        className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-2xl"
        onClick={() => navigate("/game")}
      >
        Play
      </button>
    </div>
  );
}

export default MenuScreen;