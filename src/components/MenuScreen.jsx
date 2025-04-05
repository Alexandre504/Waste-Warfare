import { useNavigate } from "react-router-dom";

function MenuScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
      <h1 className="text-5xl font-bold mb-8">🌱 Waste Warfare</h1>
      <button
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-2xl text-2xl"
        onClick={() => navigate("/game")}
      >
        Play
      </button>
    </div>
  );
}

export default MenuScreen;
