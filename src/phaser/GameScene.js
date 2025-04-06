
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.aaronGroup = null;
    this.projectileGroup = null;
    this.pollutionGroup = null;
    this.windTurbines = [];
    this.gridConfig = {
      width: 960,
      height: 600,
      cellWidth: 80,
      cellHeight: 100,
    };
    this.laneYPositions = [100, 200, 300, 400, 500];
    this.enemyHealth = 3;
    this.projectileDamage = 1;
    this.enemyPauseDuration = 1000;
    this.aaronDestroyDelay = 1500;
    this.aaronCost = 50;
    this.currentMoney = 200;
    this.moneyText = null;
    this.moneyTickInterval = 3000;
    this.moneyTickTimer = null;
    this.moneyPerTick = 25;
    this.initialSpawnDelay = 2000;
    this.minSpawnDelay = 500;
    this.spawnRateIncreaseInterval = 10000;
    this.spawnRateIncreaseFactor = 0.9;
    this.enemySpawnTimer = null;
    this.currentSpawnDelay = this.initialSpawnDelay;
    this.enemySpeedIncreaseInterval = 15000;
    this.enemySpeedIncreaseFactor = 1.1;
    this.initialEnemySpeed = -100;
    this.currentEnemySpeed = this.initialEnemySpeed;
    this.aaronMenuIcon = null;
    this.aaronPriceText = null; // To hold the price text
    this.draggingAaron = null;
  }

  preload() {
    this.load.image("trashcanEnemy", "/assets/trashcanEnemy_walking.webp");
    this.load.image("windTurbine", "/assets/windTurbine.png");
    this.load.image("projectile", "/assets/projectile.png");
    this.load.audio("warning", "/assets/warning.m4a");
    this.load.image("aaron", "/assets/aaron.png");
    this.load.audio("deadSound", "/assets/dead.m4a");
    this.load.audio("pew", "/assets/pew.m4a");
    this.load.audio("vroom", "/assets/vroom.m4a");
    this.load.audio("munch", "/assets/munch.m4a");
    this.load.image("eater", "/assets/flytrap-mob-pixilart.png");
  }

  create() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x87CEFA, 1);
    graphics.fillRect(0, 0, this.gridConfig.width, 80); // Menu area at the top
    graphics.fillStyle(0x7CFC00, 1);
    graphics.fillRect(0, 80, this.gridConfig.width, this.gridConfig.height - 80); // Game grid area
    graphics.lineStyle(4, 0x228B22, 1);
    graphics.beginPath();
    graphics.moveTo(0, 80);
    graphics.lineTo(this.gridConfig.width, 80);
    graphics.strokePath();

    this.sound.play('warning', { volume: 1 });

    
    this.pollutionGroup = this.physics.add.group();
    this.windTurbines = [];
    this.aaronGroup = this.physics.add.group();
    this.projectileGroup = this.physics.add.group();

    this.laneYPositions = [130, 230, 330, 430, 530]; // Adjust Y positions for the new grid area

    this.laneYPositions.forEach((y) => {
      const turbine = this.physics.add.sprite(50, y, "windTurbine").setScale(2);
      turbine.used = false;
      this.windTurbines.push(turbine);
    });

    this.gridConfig.cellHeight = this.laneYPositions[1] - this.laneYPositions[0];
    this.gridConfig.cellWidth = 80;

    this.startEnemySpawnTimer(this.initialSpawnDelay);

    this.time.addEvent({
      delay: this.spawnRateIncreaseInterval,
      callback: this.increaseSpawnRate,
      callbackScope: this,
      loop: true,
    });

    this.time.addEvent({
      delay: this.enemySpeedIncreaseInterval,
      callback: this.increaseEnemySpeed,
      callbackScope: this,
      loop: true,
    });

    this.time.delayedCall(120000, () => {
      this.scene.start("VictoryScene");
    });

    this.physics.add.overlap(this.pollutionGroup, this.windTurbines, this.triggerTurbine, null, this);
    this.physics.add.overlap(this.projectileGroup, this.pollutionGroup, this.hitEnemy, null, this);
    this.physics.add.collider(this.pollutionGroup, this.aaronGroup, this.handleEnemyAaronCollision, null, this);

    // Create the static Aaron menu icon
    this.aaronMenuIcon = this.add.image(this.gridConfig.width / 2, 40, "aaron").setScale(0.3).setInteractive();
    this.aaronMenuIcon.on('pointerdown', this.startAaronDrag, this);

    // Create the static Eater menu icon right next to Aaron
    this.eaterMenuIcon = this.add.image(this.gridConfig.width / 2 + 50, 40, "eater").setScale(1.5).setInteractive();
    this.eaterPriceText = this.add.text(
      this.gridConfig.width / 2 + 50,
      70, // Positioned below the Eater icon
      `$${this.aaronCost}`, // Assuming Eater costs the same as Aaron
      {
        fontSize: '16px',
        fill: '#fff',
        align: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }
    ).setOrigin(0.5, 0);
    this.eaterMenuIcon.on('pointerdown', this.startEaterDrag, this);

    // Handle drag and drop
    this.input.on('pointerup', this.stopEaterDrag, this);
    this.input.on('pointermove', this.updateEaterDrag, this);


    // Create the text for the Aaron's price
    this.aaronPriceText = this.add.text(
      this.gridConfig.width / 2,
      70, // Positioned below the icon
      `$${this.aaronCost}`,
      {
        fontSize: '16px',
        fill: '#fff',
        align: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }
    ).setOrigin(0.5, 0); // Center the text horizontally

    this.input.on('pointerup', this.stopAaronDrag, this);
    this.input.on('pointermove', this.updateAaronDrag, this);

    this.moneyText = this.add.text(10, 10, `Money: $${this.currentMoney}`, {
      fontSize: '20px',
      fill: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }).setDepth(100);

    this.startMoneyTickTimer();
  }

  startAaronDrag(pointer) {
    if (this.currentMoney >= this.aaronCost) {
      this.draggingAaron = this.add.image(pointer.x, pointer.y, "aaron").setScale(0.3).setAlpha(0.7);
    } else {
      console.log("Not enough money to place Aaron.");
    }
  }

  updateAaronDrag(pointer) {
    if (this.draggingAaron) {
      this.draggingAaron.x = pointer.x;
      this.draggingAaron.y = pointer.y;
    }
  }

  stopAaronDrag(pointer) {
    if (this.draggingAaron) {
      this.placeAaronOnGrid(pointer.x, pointer.y);
      this.draggingAaron.destroy();
      this.draggingAaron = null;
    }
  }

  startEnemySpawnTimer(delay) {
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.destroy();
    }
    this.enemySpawnTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnPollution,
      callbackScope: this,
      loop: true,
    });
  }

  increaseSpawnRate() {
    this.currentSpawnDelay *= this.spawnRateIncreaseFactor;
    if (this.currentSpawnDelay < this.minSpawnDelay) {
      this.currentSpawnDelay = this.minSpawnDelay;
    }
    this.startEnemySpawnTimer(this.currentSpawnDelay);
    console.log('Spawn delay updated:', this.currentSpawnDelay);
  }

  increaseEnemySpeed() {
    this.currentEnemySpeed *= this.enemySpeedIncreaseFactor;
    this.pollutionGroup.children.iterate(enemy => {
      if (enemy) {
        enemy.setVelocityX(this.currentEnemySpeed);
        enemy.originalVelocityX = this.currentEnemySpeed;
      }
    });
    console.log('Enemy speed updated:', this.currentEnemySpeed);
  }

  startMoneyTickTimer() {
    this.moneyTickTimer = this.time.addEvent({
      delay: this.moneyTickInterval,
      callback: this.increaseMoney,
      callbackScope: this,
      loop: true,
    });
  }

  increaseMoney() {
    this.currentMoney += this.moneyPerTick;
    this.updateMoneyText();
  }

  spawnPollution() {
    const lane = Phaser.Math.Between(0, 4);
    const y = this.laneYPositions[lane];
    const enemy = this.pollutionGroup.create(960, y, "trashcanEnemy").setScale(0.75);
    enemy.setVelocityX(this.currentEnemySpeed);
    enemy.health = this.enemyHealth;
    enemy.isPaused = false;
    enemy.pauseTimer = null;
    enemy.originalVelocityX = this.currentEnemySpeed;
    enemy.eatingAaron = null;
    console.log('Spawning enemy:', enemy.texture.key, 'at', enemy.x, enemy.y);
  }

  triggerTurbine(enemy, turbine) {
    if (!turbine.used) {
      this.sound.play('vroom', { volume: 1 });
      turbine.used = true;

      this.pollutionGroup.children.iterate((child) => {
        if (child && Math.abs(child.y - turbine.y) < this.gridConfig.cellHeight / 2) {
          this.destroyEnemy(child);
        }
      });

      turbine.setTint(0x999999);
      this.tweens.add({
        targets: turbine,
        angle: { from: -10, to: 10 },
        yoyo: true,
        repeat: 5,
        duration: 50,
      });
    }
    this.destroyEnemy(enemy);
  }

  placeAaronOnGrid(pointerX, pointerY) {
    // Only place on the game grid area
    if (pointerY > 80) {
      const gridX = Math.floor((pointerX) / this.gridConfig.cellWidth);
      const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight); // Adjust for menu height
      const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
      const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80; // Adjust for menu height

      if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
        if (this.currentMoney >= this.aaronCost) {
          this.currentMoney -= this.aaronCost;
          this.updateMoneyText();
          const aaron = this.aaronGroup.create(centerX, snappedY, "aaron").setScale(0.20);
          const aaronId = Phaser.Utils.String.UUID();
          aaron.setData('id', aaronId);
          aaron.body.setImmovable(true);
          aaron.nextShootTime = this.time.now + Phaser.Math.Between(1000, 3000);
          aaron.isBeingEaten = false;
          aaron.eatingEnemy = null;
          console.log('Placing Aaron with ID:', aaronId, 'at', centerX, snappedY);
        } else {
          console.log("Not enough money to place Aaron.");
          // Optionally, provide visual feedback that there's not enough money
        }
      }
    }
  }

  eatEnemy(eater, enemy) {
    if (!eater || !enemy) return;
  
    if (this.time.now >= eater.nextEatTime) {
      this.destroyEnemy(enemy);
      this.sound.play('munch', {volume: 1});
      eater.nextEatTime = this.time.now + eater.eatCooldown;
      console.log(`Eater at (${eater.x}, ${eater.y}) ate an enemy. Next eat available at ${eater.nextEatTime}`);
    } else {
      console.log(`Eater on cooldown. Ready again in ${Math.ceil((eater.nextEatTime - this.time.now) / 1000)}s`);
    }
  }
  hitEnemy(projectile, enemy) {
    if (!enemy || !projectile) return; // Defensive check
    projectile.destroy();
    enemy.health -= this.projectileDamage;
    console.log('Enemy hit. New health:', enemy.health);
    if (enemy.health <= 0) {
      this.stopEatingAaron(enemy);
      this.destroyEnemy(enemy);
    }
  }
  startEaterDrag(pointer) {
    if (this.currentMoney >= this.aaronCost) {  // Optional: Check if player has enough money
        this.draggingEater = this.add.image(pointer.x, pointer.y, "eater").setScale(3);
    } else {
        console.log("Not enough money to place the Eater.");
    }
}

updateEaterDrag(pointer) {
    if (this.draggingEater) {
        this.draggingEater.x = pointer.x;
        this.draggingEater.y = pointer.y;
    }
}

stopEaterDrag(pointer) {
    if (this.draggingEater) {
        this.placeEaterOnGrid(pointer.x, pointer.y);
        this.draggingEater.destroy();
        this.draggingEater = null;
    }
}

placeEaterOnGrid(pointerX, pointerY) {
  if (pointerY > 80) {
    const gridX = Math.floor(pointerX / this.gridConfig.cellWidth);
    const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight);
    const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
    const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80;

    if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
      if (this.currentMoney >= this.aaronCost) {
        this.currentMoney -= this.aaronCost;
        this.updateMoneyText();
        const eater = this.physics.add.sprite(centerX, snappedY, "eater").setScale(2);
        eater.setImmovable(true);
        eater.setInteractive();

        eater.eatCooldown = 3000; // Cooldown in ms (3 seconds)
        eater.nextEatTime = this.time.now; // Can eat immediately

        this.physics.add.overlap(eater, this.pollutionGroup, this.eatEnemy, null, this);

        console.log('Placing Eater at', centerX, snappedY);
      } else {
        console.log("Not enough money to place the Eater.");
      }
    }
  }
}
  destroyEnemy(enemy) {
    if (!enemy) return; // Defensive check
    this.stopEatingAaron(enemy);
    console.log('Destroying enemy:', enemy.texture.key);
    enemy.destroy();
  }

  handleEnemyAaronCollision(enemy, aaron) {
    if (!enemy || !aaron || aaron.isBeingEaten || enemy.eatingAaron) {
      return;
    }

    enemy.setVelocityX(0);
    enemy.isPaused = true;
    enemy.eatingAaron = aaron;
    console.log('Enemy (', enemy.texture.key, ') eating Aaron (ID:', aaron.getData('id'), ')');

    aaron.isBeingEaten = true;
    aaron.eatingEnemy = enemy;

    const aaronId = aaron.getData('id');

    if (!aaron.destroyTimer) {
      console.log('Setting destroy timer for Aaron');
      aaron.destroyTimer = this.time.delayedCall(this.aaronDestroyDelay, () => {
        const currentAaron = this.aaronGroup.getChildren().find(child => child.getData('id') === aaronId);

        if (currentAaron && currentAaron.active) {
          this.destroyAaron(currentAaron);
          this.sound.play('deadSound', { volume: 1 });
        }
      }, null, this);
    } else {
      console.log('Destroy timer already set for Aaron ID:', aaronId);
    }
  }

  stopEatingAaron(enemy) {
    if (enemy && enemy.eatingAaron) {
      const aaron = enemy.eatingAaron;
      if (aaron && aaron.active) {
        aaron.isBeingEaten = false;
        aaron.eatingEnemy = null;
        console.log('Enemy (', enemy.texture.key, ') stopped eating Aaron (ID:', aaron.getData('id'), ')');
      }
      enemy.eatingAaron = null;
      enemy.setVelocityX(enemy.originalVelocityX);
      enemy.isPaused = false;
    }
  }

  destroyAaron(aaron) {
    if (aaron) {
      const aaronId = aaron.getData('id');
      console.log('Destroying Aaron with ID:', aaronId, 'at', aaron.x, aaron.y);
      if (aaron.eatingEnemy) {
        this.stopEatingAaron(aaron.eatingEnemy);
      }
      aaron.destroy();
    } else {
      console.log('Attempting to destroy a null Aaron.');
    }
  }

  updateMoneyText() {
    if (this.moneyText) {
      this.moneyText.setText(`Money: $${this.currentMoney}`);
    }
  }

  update() {
    this.pollutionGroup.children.iterate((enemy) => {
      if (enemy) {
        if (enemy.x < 10) {
          this.stopEatingAaron(enemy);
          this.destroyEnemy(enemy);
          this.scene.start("DefeatScene");
        }
        if (enemy.eatingAaron && !enemy.eatingAaron.active) {
          console.log('Update: Enemy (', enemy.texture.key, ') was eating Aaron (ID:', enemy.eatingAaron.getData('id'), ') which is no longer active. Resuming movement.');
          enemy.setVelocityX(enemy.originalVelocityX);
          enemy.isPaused = false;
          enemy.eatingAaron = null;
        }
      }
    });

    this.aaronGroup.children.iterate((aaron) => {
      if (aaron && !aaron.isBeingEaten) {
        if (this.time.now > aaron.nextShootTime) {
          this.shootProjectile(aaron);
          this.sound.play('pew', { volume: 1 });
          aaron.nextShootTime = this.time.now + Phaser.Math.Between(1000, 3000);
        }
      }
    });
  }

  shootProjectile(aaron) {
    const projectile = this.projectileGroup.create(aaron.x + aaron.width / 2, aaron.y, "projectile").setScale(1.5);
    projectile.setVelocityX(200);
  }
}



