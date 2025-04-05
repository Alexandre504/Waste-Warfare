import { useNavigate } from "react-router-dom";

function VictoryScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100">
      <h1 className="text-5xl font-bold mb-8">🏆 Victory!</h1>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-2xl"
        onClick={() => navigate("/")}
      >
        Play Again
      </button>
    </div>
  );
}

export default VictoryScreen;
