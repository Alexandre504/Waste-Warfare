import React from 'React'
import { useNavigate } from "react-router-dom";

function DefeatScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-100">
      <h1 className="text-6xl font-bold mb-8 text-red-800">💀 Pollution Took Over...</h1>
      <button
        className="bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-lg text-2xl"
        onClick={() => navigate("/")}
      >
        Try Again
      </button>
    </div>
  );
}

export default DefeatScreen;
