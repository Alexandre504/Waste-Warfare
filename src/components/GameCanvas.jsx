import { useEffect } from "react";
import Phaser from "phaser";
import GameScene from "../phaser/GameScene";

function GameCanvas() {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 960,
      height: 600,
      parent: "game-container",
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      scene: [GameScene],
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-container" className="w-full h-screen"></div>;
}

export default GameCanvas;
