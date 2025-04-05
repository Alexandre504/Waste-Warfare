import { useNavigate } from "react-router-dom";

function DefeatScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-100">
      <h1 className="text-5xl font-bold mb-8">💀 Defeat...</h1>
      <button
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl text-2xl"
        onClick={() => navigate("/")}
      >
        Try Again
      </button>
    </div>
  );
}

export default DefeatScreen;
