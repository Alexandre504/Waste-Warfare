export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.image("trashcanEnemy", "/assets/trashcanEnemy.png");
    this.load.image("windTurbine", "/assets/windTurbine.png");
    this.load.image("projectile", "/assets/projectile.png");
  }

  create() {
    // Fancy gradient background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x87CEFA, 1); // Sky blue
    graphics.fillRect(0, 0, 960, 300);
    graphics.fillStyle(0x7CFC00, 1); // Grass green
    graphics.fillRect(0, 300, 960, 300);
    graphics.lineStyle(4, 0x228B22, 1);
    graphics.beginPath();
    graphics.moveTo(0, 300);
    graphics.lineTo(960, 300);
    graphics.strokePath();

    // Groups
    this.pollutionGroup = this.physics.add.group();
    this.windTurbines = [];

    // Lanes
    const laneYPositions = [100, 200, 300, 400, 500];
    laneYPositions.forEach((y) => {
      const turbine = this.physics.add.sprite(50, y, "windTurbine").setScale(0.5);
      turbine.used = false;
      this.windTurbines.push(turbine);
    });

    // Spawn enemies every 2 seconds
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnPollution,
      callbackScope: this,
      loop: true,
    });

    // End game after 2 minutes
    this.time.delayedCall(120000, () => {
      this.scene.start("VictoryScene");
    });

    // Turbine trigger
    this.physics.add.overlap(this.pollutionGroup, this.windTurbines, this.triggerTurbine, null, this);
  }

  spawnPollution() {
    const lane = Phaser.Math.Between(0, 4);
    const y = 100 + lane * 100;
    const enemy = this.pollutionGroup.create(960, y, "trashcanEnemy").setScale(1.5);
    enemy.setVelocityX(-50);

    // Add small wobble animation
    this.tweens.add({
      targets: enemy,
      y: y + 5,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });
  }

  triggerTurbine(enemy, turbine) {
    if (!turbine.used) {
      turbine.used = true;

      // Destroy enemies in same lane
      this.pollutionGroup.children.iterate((child) => {
        if (child && Math.abs(child.y - turbine.y) < 50) {
          child.destroy();
        }
      });

      turbine.setTint(0x999999);

      // Shake animation
      this.tweens.add({
        targets: turbine,
        angle: { from: -10, to: 10 },
        yoyo: true,
        repeat: 5,
        duration: 50,
      });
    }
    enemy.destroy();
  }

  update() {
    this.pollutionGroup.children.iterate((child) => {
      if (child && child.x < 10) {
        this.scene.start("DefeatScene");
      }
    });
  }
}
