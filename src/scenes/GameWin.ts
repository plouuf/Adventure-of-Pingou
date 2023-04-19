import Phaser from 'phaser'

export default class GameWin extends Phaser.Scene { 
  constructor() { 
    super('game-win')
  }

  create() { 
    const { width, height } = this.scale;

    this.add.text(width * 0.5, height * 0.3, 'You Won!', {
      fontSize: '55px',
      color: '#00ff00'
    })
      .setOrigin(0.5)
    
    const button = this.add.rectangle(width * 0.5, height * 0.6, 150, 75, 0xffffff)
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => { 
        this.scene.start('game')
      })
    
    this.add
      .text(button.x, button.y, "Play Again", {
        color: "#000000",
      })
      .setOrigin(0.5);
  }
}
