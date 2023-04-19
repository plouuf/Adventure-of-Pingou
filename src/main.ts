import Phaser from "phaser";
import Game from "./scenes/Game";
import UI from "./scenes/UI"
import GameOver from "./scenes/GameOver"
import GameWin from "./scenes/GameWin";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "matter",
    matter: {
      debug: false,
    },
  },
  scene: [Game, UI, GameOver, GameWin],
};

export default new Phaser.Game(config);
