import Phaser from 'phaser';
import StateMachine from './statemachine/StateMachine';
import { events } from './EventCenter';
import ObstaclesController from './ObstaclesController';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class PlayerControl {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine;
  private cursors: CursorKeys;
  private obstacles: ObstaclesController;
  private health = 100;
  private jumpCount = 0;

  private lastSnowman?: Phaser.Physics.Matter.Sprite;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: CursorKeys,
    obstacles: ObstaclesController
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;

    this.penguinAnimation();

    this.stateMachine = new StateMachine(this, 'penguin');

    this.stateMachine
      .addState('idle', {
        onEnter: this.idleOnEnter,
        onUpdate: this.idleOnUpdate,
      })
      .addState('walk', {
        onEnter: this.walkOnEnter,
        onUpdate: this.walkOnUpdate,
      })
      .addState('jump', {
        onEnter: this.jumpOnEnter,
        onUpdate: this.jumpOnUpdate,
      })
      .addState('spike-hit', {
        onEnter: this.spikeOnEnter,
      })
      .addState('snowman-hit', {
        onEnter: this.snowmanHitOnEnter,
      })
      .addState('snowman-stomp', {
        onEnter: this.snowmanStompOnEnter,
      })
      .addState('dead', {
        onEnter: this.deadOnEnter,
      })
      .setState('idle');

    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyA as MatterJS.BodyType;
      const gameObject = body.gameObject;

      const bodyB = data.bodyB as MatterJS.BodyType;
      const gameObjectB = bodyB.gameObject;

      // console.log("Width", gameObjectB.width)
      // console.log("Height", gameObjectB.height)

      if (this.obstacles.is('spikes', bodyB)) {
        this.stateMachine.setState('spike-hit');
        return;
      }

      if (this.obstacles.is('snowman', bodyB)) {
        this.lastSnowman = bodyB.gameObject;
        if (this.sprite.y < bodyB.position.y) {
          //stomp on snowman
          this.stateMachine.setState('snowman-stomp');
        } else {
          //hit by snowman
          this.stateMachine.setState('snowman-hit');
        }
        return;
      }

      if (!gameObject || !gameObjectB) {
        return;
      }

      if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
        if (this.stateMachine.isCurrentState('jump')) {
          this.stateMachine.setState('idle');
        }
        return;
      }

      const sp = gameObjectB as Phaser.Physics.Matter.Sprite;
      const type = sp.getData('type');

      switch (type) {
        case 'star': {
          // console.log('collided with star')
          events.emit('star-collected');

          //check if all stars collected here then game win scene
          

          
          sp.destroy();
          break;
        }

        case 'health': {
          const value = sprite.getData('healthGain') ?? 25;
          this.health = Phaser.Math.Clamp(this.health + value, 0, 100);
          events.emit('health-changed', this.health);
          sp.destroy();
          break;
        }
      }
    });
    this.sprite.setFriction(0);
  }

  update(dt: number) {
    // To add off map dead
    if (this.sprite.y > +this.scene.game.config.height + 500) {
      // Player fell off the map, trigger game over event
      this.stateMachine.setState("dead");
      return;
    }
    this.stateMachine.update(dt);
  }

  private setHeath(value: number) {
    this.health = Phaser.Math.Clamp(value, 0, 100);
    events.emit('health-changed', this.health);

    if (this.health <= 0) {
      this.stateMachine.setState('dead');
    }
  }

  private idleOnEnter() {
    this.sprite.play('penguin-idle');
    this.jumpCount = 0;
  }

  private idleOnUpdate() {
    if (this.cursors.left.isDown || this.cursors.right.isDown) {
      this.stateMachine.setState('walk');
    }

    const penguinJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (penguinJump) {
      this.stateMachine.setState('jump');
    }
  }

  private walkOnEnter() {
    this.sprite.play('penguin-walk');
  }

  private walkOnUpdate() {
    this.makePenguinWalk();

    const penguinJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (penguinJump) {
      this.stateMachine.setState('jump');
    }
  }

  private jumpOnEnter() {
    this.sprite.play('penguin-jump');
    this.sprite.setVelocityY(-9);
  }

  private jumpOnUpdate() {
    const speed = 5;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(speed);
    }

    // Check if the player can double jump
    const canDoubleJump =
      this.sprite.body.velocity.y >= -5 && this.sprite.body.velocity.y <= 5 && this.jumpCount < 1;

    if (canDoubleJump && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.sprite.setVelocityY(-10);
      this.jumpCount++
      return;
    }

  }

  private spikeOnEnter() {
    this.sprite.setVelocityY(-12);

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0000);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value
        );

        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b
        );
        this.sprite.setTint(color);
      },
    });
    this.stateMachine.setState('idle');
    this.setHeath(this.health - 10);
  }

  private snowmanHitOnEnter() {
    if (this.lastSnowman) {
      if (this.sprite.x < this.lastSnowman.x) {
        this.sprite.setVelocityX(-12);
      } else {
        this.sprite.setVelocityX(12);
      }
    } else {
      this.sprite.setVelocityY(-15);
    }

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0000);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value
        );

        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b
        );
        this.sprite.setTint(color);
      },
    });

    this.stateMachine.setState('idle');
    this.setHeath(this.health - 20);
  }

  private snowmanStompOnEnter() {
    this.sprite.setVelocityY(-10);
    this.stateMachine.setState('idle');

    events.emit('snowman-stomped', this.lastSnowman);
  }

  private deadOnEnter() {
    this.sprite.play('penguin-die');

    this.sprite.setOnCollide(() => {});

    this.scene.time.delayedCall(1200, () => {
      this.scene.scene.stop('game')
      this.scene.scene.start('game-over');
    });
  }

  private makePenguinWalk() {
    const speed = 5;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(speed);
    } else {
      this.sprite.setVelocityX(0);
      this.stateMachine.setState('idle');
    }
  }

  private penguinAnimation() {
    this.sprite.anims.create({
      key: 'penguin-idle',
      frames: [{ key: 'penguin', frame: 'penguin_walk01.png' }],
    });

    this.sprite.anims.create({
      key: 'penguin-walk',
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames('penguin', {
        start: 1,
        end: 4,
        prefix: 'penguin_walk0',
        suffix: '.png',
      }),
      repeat: -1,
    });

    this.sprite.anims.create({
      key: 'penguin-jump',
      frames: [{ key: 'penguin', frame: 'penguin_jump02.png' }],
    });

    this.sprite.anims.create({
      key: 'penguin-die',
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames('penguin', {
        start: 1,
        end: 4,
        prefix: 'penguin_die0',
        suffix: '.png',
      }),
    });
  }
}
