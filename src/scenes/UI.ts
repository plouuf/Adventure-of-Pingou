import Phaser from "phaser";
import { events } from "./EventCenter";

export default class UI extends Phaser.Scene {
  private starsLabel!: Phaser.GameObjects.Text;
  private starsCollected = 0;
  private graphics!: Phaser.GameObjects.Graphics;

  private timerLabel!: Phaser.GameObjects.Text;
  private timer!: Phaser.Time.TimerEvent;
  private startTime = 0;


  private lastHealth = 100;

  constructor() {
    super({
      key: "ui",
    });
  }

  init() {
    this.starsCollected = 0;
    this.startTime = 0;
  }

  create() {
    this.graphics = this.add.graphics();
    this.setHealthBar(100);

    this.starsLabel = this.add.text(10, 35, "Stars: 0", {
      fontSize: "25px",
      fontStyle: "bold",
    });

    this.timerLabel = this.add.text(645, 5, "Time: 0", {
      fontSize: "25px",
      fontStyle: "bold",
    });

    events.on("star-collected", this.handleStarCollection, this);
    events.on("health-changed", this.handleHealth, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.off("star-collected", this.handleStarCollection, this);
    });

    // start the timer
    this.timer = this.time.addEvent({
      delay: 1000, // 1 second
      loop: true,
      callback: () => {
        this.startTime++;
      },
    });
  }

  update() { 
    const minutes = Math.floor(this.startTime / 60);
    const seconds = this.startTime % 60;
    this.timerLabel.text = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (this.starsCollected === 7) {
      this.scene.scene.time.delayedCall(500, () => {
        this.scene.stop('game')
        this.scene.start('game-win');
      });
    }
  }

  
  private handleStarCollection() {
    this.starsCollected++;
    this.starsLabel.text = `Stars: ${this.starsCollected}`;
  }

  private handleHealth(value: number) {
    this.tweens.addCounter({
      from: this.lastHealth,
      to: value,
      duration: 200,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        this.setHealthBar(value);
      },
    });
    this.lastHealth = value;
  }

  private setHealthBar(value: number) {
    const width = 200;
    const percent = Phaser.Math.Clamp(value, 0, 100) / 100;

    this.graphics.clear();
    this.graphics.fillStyle(0x808080);
    this.graphics.fillRoundedRect(10, 10, width, 20, 5);
    if (percent > 0 && percent <= 0.2) {
      this.graphics.fillStyle(0xff0000);
      this.graphics.fillRoundedRect(10, 10, width * percent, 20, 5);
    } else if (percent > 0.2) {
      this.graphics.fillStyle(0x00ff00);
      this.graphics.fillRoundedRect(10, 10, width * percent, 20, 5);
    }
  }
}
