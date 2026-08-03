import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("main");
  }

  create() {
    this.add
      .text(16, 16, "StudyXP — Phase 0 placeholder room", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setDepth(1);

    this.player = this.add.rectangle(400, 300, 32, 32, 0x4ade80);
    this.physics.add.existing(this.player);
    this.cursors = this.input.keyboard?.createCursorKeys();
  }

  update() {
    if (!this.player || !this.cursors) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 200;
    body.setVelocity(0);

    if (this.cursors.left.isDown) body.setVelocityX(-speed);
    else if (this.cursors.right.isDown) body.setVelocityX(speed);

    if (this.cursors.up.isDown) body.setVelocityY(-speed);
    else if (this.cursors.down.isDown) body.setVelocityY(speed);
  }
}
