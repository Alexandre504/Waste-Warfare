export default class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: "GameScene" });
    }
  
    preload() {
      // Load the images
      this.load.image("pollutionEnemy", "/assets/pollutionEnemy.png");
      this.load.image("windTurbine", "/assets/windTurbine.png");
    }
  
    create() {
      // Group for enemies
      this.pollutionGroup = this.physics.add.group();
  
      // Spawn pollution enemies every 2 seconds
      this.time.addEvent({
        delay: 2000,
        callback: this.spawnPollution,
        callbackScope: this,
        loop: true,
      });
  
      // Set up wind turbines at the left end of each lane
      this.windTurbines = [];
      const laneYPositions = [100, 200, 300, 400, 500];
  
      laneYPositions.forEach((y) => {
        const turbine = this.physics.add.sprite(50, y, "windTurbine").setScale(0.5);
        turbine.used = false;
        this.windTurbines.push(turbine);
      });
  
      // Collision detection between enemies and turbines
      this.physics.add.overlap(this.pollutionGroup, this.windTurbines, this.triggerTurbine, null, this);
    }
  
    spawnPollution() {
      const randomLane = Phaser.Math.Between(0, 4);
      const yPosition = 100 + randomLane * 100;
  
      const enemy = this.pollutionGroup.create(960, yPosition, "pollutionEnemy").setScale(0.5);
      enemy.setVelocityX(-50); // move slowly to the left
      enemy.lane = randomLane;
    }
  
    triggerTurbine(enemy, turbine) {
      if (!turbine.used) {
        turbine.used = true;
  
        // Destroy all enemies in the same lane
        this.pollutionGroup.children.iterate((child) => {
          if (Math.abs(child.y - turbine.y) < 50) {
            child.destroy();
          }
        });
  
        turbine.setTint(0x999999); // Fade out turbine to show it's used
      }
  
      enemy.destroy(); // Destroy the triggering enemy
    }
  
    update() {
      // Check if any pollution enemies pass the left edge
      this.pollutionGroup.children.iterate((child) => {
        if (child && child.x < 0) {
          // For now just restart scene or you can redirect to DefeatScreen
          this.scene.restart();
        }
      });
    }
  }
  