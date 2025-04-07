export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.aaronGroup = null;
    this.projectileGroup = null;
    this.pollutionGroup = null;
    this.eaterGroup = null; // NEW: Group for Eater instances
    this.windTurbines = [];
    this.gridConfig = {
      width: 960,
      height: 600,
      cellWidth: 80,
      cellHeight: 100,
    };
    this.laneYPositions = [100, 200, 300, 400, 500];
    this.enemyHealth = 4; // Increased from 3 for more challenge
    this.projectileDamage = 1;
    this.enemyPauseDuration = 1000; // Note: Not used for Eater pause
    this.aaronDestroyDelay = 2000; // Increased from 1500
    this.aaronCost = 75; // Increased from 50
    this.eaterCost = 100; // Increased from 75
    this.currentMoney = 150; // Reduced starting money
    this.moneyText = null;
    this.moneyTickInterval = 2000; // Reduced from 3000 for better flow
    this.moneyTickTimer = null;
    this.moneyPerTick = 20; // Reduced from 25
    this.initialSpawnDelay = 3000; // Increased from 2000 for easier start
    this.minSpawnDelay = 800; // Increased from 500
    this.spawnRateIncreaseInterval = 15000; // Increased from 10000
    this.spawnRateIncreaseFactor = 0.95; // Changed from 0.9 for smoother scaling
    this.enemySpawnTimer = null;
    this.currentSpawnDelay = this.initialSpawnDelay;
    this.enemySpeedIncreaseInterval = 20000; // Increased from 15000
    this.enemySpeedIncreaseFactor = 1.08; // Reduced from 1.1
    this.initialEnemySpeed = -80; // Reduced from -100 for easier start
    this.currentEnemySpeed = this.initialEnemySpeed;
    this.aaronMenuIcon = null;
    this.aaronPriceText = null;
    this.eaterMenuIcon = null; // NEW
    this.eaterPriceText = null; // NEW
    this.draggingAaron = null;
    this.draggingEater = null; // NEW
    this.projectileSpeed = 250; // Increased projectile speed
    this.minShootInterval = 1200; // Minimum time between shots
    this.maxShootInterval = 2500; // Maximum time between shots

    // Updated enemy types with larger sizes
    this.enemyTypes = {
        trashcan: {
            key: 'trashcanEnemy',
            health: 4,
            speed: -80,
            scale: 0.5  // Increased from 0.75
        },
        barrel: {
            key: 'barrel',
            health: 5,
            speed: -50,
            scale: 2  // Increased from 0.8
        },
        reactor: {
            key: 'reactor',
            health: 7,
            speed: -50,
            scale: 2  // Increased from 0.7
        }
    };

    // Updated defender types with new units
    this.defenderTypes = {
        aaron: {
            key: 'aaron',
            cost: 75,
            scale: 0.2,
            shootInterval: [1200, 2500]
        },
        eater: {
            key: 'eater',
            cost: 100,
            scale: 2,
            eatCooldown: 4000
        },
        tree: {
            key: 'tree',
            cost: 100,
            scale: 2,
            moneyInterval: 5000,
            moneyAmount: 25
        },
        poppy: {
            key: 'poppy',
            cost: 125,
            scale: 2,
            shootInterval: 2000,
            shootRange: 300,
            projectileDamage: 2
        }
    };

    // New properties
    this.treeGroup = null;
    this.poppyGroup = null;
    this.treeMenuIcon = null;
    this.treePriceText = null;
    this.poppyMenuIcon = null;
    this.poppyPriceText = null;
    this.draggingTree = null;
    this.draggingPoppy = null;
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
    this.load.image("background", "/assets/background.png");

    // Load new enemy assets
    this.load.image("barrel", "/assets/barrel-mob-pixilart.png");
    this.load.image("reactor", "/assets/nukereactor-pixilart.png");
    
    // Load new defender assets
    this.load.image("tree", "/assets/tree-pixilart.png");
    this.load.image("poppy", "/assets/poppy-pixilart.png");
  }

  create() {
    this.sound.play('warning', { volume: 1 });
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);
    this.background.displayWidth = this.cameras.main.width;
    this.background.displayHeight = this.cameras.main.height;
    this.background.setDepth(-1); // Ensure the background is behind other elements

    // Create physics groups
    this.pollutionGroup = this.physics.add.group();
    this.windTurbines = [];
    this.aaronGroup = this.physics.add.group({ immovable: true }); // Aarons don't move
    this.projectileGroup = this.physics.add.group();
    this.eaterGroup = this.physics.add.group({ immovable: true }); // NEW: Eaters don't move
    this.treeGroup = this.physics.add.group({ immovable: true });
    this.poppyGroup = this.physics.add.group({ immovable: true });

    this.laneYPositions = [130, 230, 330, 430, 530]; // Adjusted Y positions

    this.laneYPositions.forEach((y) => {
      const turbine = this.physics.add.sprite(50, y, "windTurbine").setScale(2);
      turbine.used = false;
      this.windTurbines.push(turbine);
    });

    this.gridConfig.cellHeight = this.laneYPositions[1] - this.laneYPositions[0];
    this.gridConfig.cellWidth = 80;

    this.startEnemySpawnTimer(this.initialSpawnDelay);

    // Timers for difficulty scaling
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

    // Victory timer
    this.time.delayedCall(120000, () => {
      this.scene.start("VictoryScene");
    });

    // Setup physics overlaps and colliders
    this.physics.add.overlap(this.pollutionGroup, this.windTurbines, this.triggerTurbine, null, this);
    this.physics.add.overlap(this.projectileGroup, this.pollutionGroup, this.hitEnemy, null, this);
    this.physics.add.collider(this.pollutionGroup, this.aaronGroup, this.handleEnemyAaronCollision, null, this);
    // NEW: Centralized overlap for Eaters and Enemies
    this.physics.add.overlap(this.eaterGroup, this.pollutionGroup, this.handleEaterEnemyOverlap, null, this);

    // --- Menu Icons ---
    // Aaron Icon
    this.aaronMenuIcon = this.add.image(this.gridConfig.width / 2 - 30, 40, "aaron").setScale(0.3).setInteractive();
    this.aaronMenuIcon.on('pointerdown', this.startAaronDrag, this);
    this.aaronPriceText = this.add.text(
        this.aaronMenuIcon.x, 70, `$${this.aaronCost}`,
        { fontSize: '16px', fill: '#fff', align: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }
    ).setOrigin(0.5, 0);

    // Eater Icon
    this.eaterMenuIcon = this.add.image(this.gridConfig.width / 2 + 30, 40, "eater").setScale(1.5).setInteractive();
    this.eaterMenuIcon.on('pointerdown', this.startEaterDrag, this);
    this.eaterPriceText = this.add.text(
        this.eaterMenuIcon.x, 70, `$${this.eaterCost}`, // Use eaterCost
        { fontSize: '16px', fill: '#fff', align: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }
    ).setOrigin(0.5, 0);

    // Tree Icon
    this.treeMenuIcon = this.add.image(this.gridConfig.width / 2 + 90, 40, "tree")
        .setScale(0.4)
        .setInteractive();
    this.treeMenuIcon.on('pointerdown', this.startTreeDrag, this);
    this.treePriceText = this.add.text(
        this.treeMenuIcon.x, 70,
        `$${this.defenderTypes.tree.cost}`,
        { fontSize: '16px', fill: '#fff', align: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }
    ).setOrigin(0.5, 0);

    // Poppy Icon
    this.poppyMenuIcon = this.add.image(this.gridConfig.width / 2 + 150, 40, "poppy")
        .setScale(0.3)
        .setInteractive();
    this.poppyMenuIcon.on('pointerdown', this.startPoppyDrag, this);
    this.poppyPriceText = this.add.text(
        this.poppyMenuIcon.x, 70,
        `$${this.defenderTypes.poppy.cost}`,
        { fontSize: '16px', fill: '#fff', align: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }
    ).setOrigin(0.5, 0);

    // Add to pointer handlers
    this.input.on('pointerup', (pointer) => {
        this.stopAaronDrag(pointer);
        this.stopEaterDrag(pointer);
        this.stopTreeDrag(pointer);
        this.stopPoppyDrag(pointer);
    });

    this.input.on('pointermove', (pointer) => {
        this.updateAaronDrag(pointer);
        this.updateEaterDrag(pointer);
        this.updateTreeDrag(pointer);
        this.updatePoppyDrag(pointer);
    });

    // Money Display
    this.moneyText = this.add.text(10, 10, `Money: $${this.currentMoney}`, {
      fontSize: '20px', fill: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }).setDepth(100);

    this.startMoneyTickTimer();
  }

  // --- Drag and Drop Functions ---

  startAaronDrag(pointer) {
    // Prevent starting a new drag if one is in progress
    if (this.draggingAaron || this.draggingEater) return;
    if (this.currentMoney >= this.aaronCost) {
      // Create a temporary, draggable image
      this.draggingAaron = this.add.image(pointer.x, pointer.y, "aaron").setScale(0.3).setAlpha(0.7).setDepth(101);
    } else {
      console.log("Not enough money to place Aaron.");
      // Optional: Add visual feedback like tinting the icon red briefly
    }
  }

  updateAaronDrag(pointer) {
    if (this.draggingAaron) {
      this.draggingAaron.x = pointer.x;
      this.draggingAaron.y = pointer.y;
    }
  }
  
  triggerTurbine(enemy, turbine) {
    if (!turbine || !turbine.active) {
      console.log('Invalid turbine');
      return;
    }
    
    if (!turbine.used) {
      turbine.used = true;
      
      // Visual feedback - flash the turbine before disappearing
      this.tweens.add({
        targets: turbine,
        alpha: 0, // Fully transparent
        duration: 200,
        onComplete: () => {
          turbine.setVisible(false);
          turbine.alpha = 1; // Reset alpha in case you reuse this object later
        }
      });
      
      // Ensure we have a physics body before setting velocity
      if (!turbine.body) {
        this.physics.world.enable(turbine);
      }
      
      // Get the Y position of the turbine's row with tolerance
      const turbineRowY = turbine.y;
      const rowTolerance = 5; // Allow small variation in Y position
      
      // Check if groups exist before trying to access them
      let enemiesInRow = [];
      if (this.pollutionGroup && this.pollutionGroup.getChildren) {
        enemiesInRow = this.pollutionGroup.getChildren().filter(
          e => e && e.active && Math.abs(e.y - turbineRowY) <= rowTolerance
        );
      }
      
      let projectilesInRow = [];
      if (this.projectileGroup && this.projectileGroup.getChildren) {
        projectilesInRow = this.projectileGroup.getChildren().filter(
          p => p && p.active && Math.abs(p.y - turbineRowY) <= rowTolerance
        );
      }
      
      console.log(`Found ${enemiesInRow.length} enemies and ${projectilesInRow.length} projectiles in row`);
      
      // Make copies of the arrays for safe removal
      const enemyCopy = [...enemiesInRow];
      const projectileCopy = [...projectilesInRow];
      
      // Process enemies with individual timers
      enemyCopy.forEach((enemyToDestroy, index) => {
        this.time.delayedCall(index * 100, () => { // Stagger destruction by 100ms
          if (enemyToDestroy && enemyToDestroy.active) {
            this.destroyEnemy(enemyToDestroy);
            console.log('Destroyed enemy in row');
          }
        }, null, this);
      });
      
      // Process projectiles with individual timers
      projectileCopy.forEach((projectileToDestroy, index) => {
        this.time.delayedCall(index * 50, () => { // Stagger destruction by 50ms
          if (projectileToDestroy && projectileToDestroy.active) {
            projectileToDestroy.destroy();
            console.log('Destroyed projectile in row');
          }
        }, null, this);
      });
      
      // Add a sound effect for the turbine being triggered
      this.sound.play('vroom', { volume: 1 });
      console.log('Turbine activated and sweeping');
      
      // Actual destruction is delayed to allow invisible turbine's effects to complete
      this.time.delayedCall(2000, () => {
        if (turbine && turbine.active) {
          turbine.destroy();
          console.log('Turbine destroyed after effects completed');
        }
      }, null, this);
    } else {
      // If turbine was already used but somehow got triggered again
      console.log('Turbine already used');
    }
    
    // Do NOT destroy the turbine here, as it would happen immediately!
    // Remove this line: turbine.destroy();
  }
  stopAaronDrag(pointer) {
    if (this.draggingAaron) {
      // Try placing Aaron on the grid if pointer is in the valid area
      if (pointer.y > 80) { // Only place below the menu bar
         this.placeAaronOnGrid(pointer.x, pointer.y);
      } else {
         console.log("Cannot place Aaron in the menu area.");
      }
      // Always destroy the temporary drag image
      this.draggingAaron.destroy();
      this.draggingAaron = null;
    }
  }

  startEaterDrag(pointer) {
    // Prevent starting a new drag if one is in progress
    if (this.draggingAaron || this.draggingEater) return;
    if (this.currentMoney >= this.eaterCost) { // Use eaterCost
       // Create a temporary, draggable image
      this.draggingEater = this.add.image(pointer.x, pointer.y, "eater").setScale(2).setAlpha(0.7).setDepth(101); // Adjust scale if needed
    } else {
      console.log("Not enough money to place the Eater.");
       // Optional: Add visual feedback
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
       // Try placing Eater on the grid if pointer is in the valid area
      if (pointer.y > 80) { // Only place below the menu bar
        this.placeEaterOnGrid(pointer.x, pointer.y);
      } else {
         console.log("Cannot place Eater in the menu area.");
      }
      // Always destroy the temporary drag image
      this.draggingEater.destroy();
      this.draggingEater = null;
    }
  }

  startTreeDrag(pointer) {
    if (this.draggingAaron || this.draggingEater || this.draggingTree || this.draggingPoppy) return;
    if (this.currentMoney >= this.defenderTypes.tree.cost) {
        this.draggingTree = this.add.image(pointer.x, pointer.y, "tree")
            .setScale(this.defenderTypes.tree.scale)
            .setAlpha(0.7)
            .setDepth(101);
    }
  }

  updateTreeDrag(pointer) {
    if (this.draggingTree) {
        this.draggingTree.x = pointer.x;
        this.draggingTree.y = pointer.y;
    }
  }

  stopTreeDrag(pointer) {
    if (this.draggingTree) {
        if (pointer.y > 80) {
            this.placeTreeOnGrid(pointer.x, pointer.y);
        }
        this.draggingTree.destroy();
        this.draggingTree = null;
    }
  }

  startPoppyDrag(pointer) {
    if (this.draggingAaron || this.draggingEater || this.draggingTree || this.draggingPoppy) return;
    if (this.currentMoney >= this.defenderTypes.poppy.cost) {
        this.draggingPoppy = this.add.image(pointer.x, pointer.y, "poppy")
            .setScale(this.defenderTypes.poppy.scale)
            .setAlpha(0.7)
            .setDepth(101);
    }
  }

  updatePoppyDrag(pointer) {
    if (this.draggingPoppy) {
        this.draggingPoppy.x = pointer.x;
        this.draggingPoppy.y = pointer.y;
    }
  }

  stopPoppyDrag(pointer) {
    if (this.draggingPoppy) {
        if (pointer.y > 80) {
            this.placePoppyOnGrid(pointer.x, pointer.y);
        }
        this.draggingPoppy.destroy();
        this.draggingPoppy = null;
    }
  }

  // --- Placement Functions ---

  placeAaronOnGrid(pointerX, pointerY) {
    const gridX = Math.floor(pointerX / this.gridConfig.cellWidth);
    const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight);
    const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
    const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80;

    // Check if position is occupied
    const isOccupied = this.checkGridOccupied(centerX, snappedY);
    if (isOccupied) {
        console.log("Space already occupied!");
        return;
    }

    // Rest of your existing placement code
    if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
      if (this.currentMoney >= this.aaronCost) {
        this.currentMoney -= this.aaronCost;
        this.updateMoneyText();

        // Create Aaron and add to its group
        const aaron = this.aaronGroup.create(centerX, snappedY, "aaron").setScale(0.20);
        const aaronId = Phaser.Utils.String.UUID(); // Unique ID for tracking
        aaron.setData('id', aaronId);
        // aaron.body.setImmovable(true); // Group handles this now
        aaron.nextShootTime = this.time.now + Phaser.Math.Between(this.minShootInterval, this.maxShootInterval); // Randomize first shot
        aaron.isBeingEaten = false;
        aaron.eatingEnemy = null; // Which enemy is eating this Aaron
        aaron.destroyTimer = null; // Timer handle for destruction while being eaten

        console.log('Placing Aaron with ID:', aaronId, 'at', centerX, snappedY);
      } else {
        console.log("Not enough money to place Aaron (final check).");
        // No need to log again if already logged in startDrag
      }
    } else {
         console.log("Attempted to place Aaron outside grid bounds.");
    }
  }

  placeEaterOnGrid(pointerX, pointerY) {
    const gridX = Math.floor(pointerX / this.gridConfig.cellWidth);
    const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight);
    const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
    const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80;

    // Check if position is occupied
    const isOccupied = this.checkGridOccupied(centerX, snappedY);
    if (isOccupied) {
        console.log("Space already occupied!");
        return;
    }

    // Rest of your existing placement code
    if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
      if (this.currentMoney >= this.eaterCost) { // Check eaterCost
        this.currentMoney -= this.eaterCost; // Deduct eaterCost
        this.updateMoneyText();

        // Create Eater and add to its group
        const eater = this.eaterGroup.create(centerX, snappedY, "eater").setScale(2);
        // eater.body.setImmovable(true); // Group handles this now
        // eater.setInteractive(); // Only needed if Eaters are clickable

        // Eater specific properties
        eater.eatCooldown = 4000; // Increased from 3000 for balance
        eater.nextEatTime = this.time.now; // Can eat immediately after placement

        console.log('Placing Eater at', centerX, snappedY);

        // REMOVED: Individual overlap, handled by group overlap in create()
        // this.physics.add.overlap(eater, this.pollutionGroup, this.handleEaterEnemyOverlap, null, this);

      } else {
        console.log("Not enough money to place the Eater (final check).");
      }
    } else {
         console.log("Attempted to place Eater outside grid bounds.");
    }
  }
  

  placeTreeOnGrid(pointerX, pointerY) {
    const gridX = Math.floor(pointerX / this.gridConfig.cellWidth);
    const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight);
    const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
    const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80;

    if (this.checkGridOccupied(centerX, snappedY)) return;

    if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
        if (this.currentMoney >= this.defenderTypes.tree.cost) {
            this.currentMoney -= this.defenderTypes.tree.cost;
            this.updateMoneyText();

            const tree = this.treeGroup.create(centerX, snappedY, "tree")
                .setScale(this.defenderTypes.tree.scale);
            
            // Set up money generation
            tree.moneyTimer = this.time.addEvent({
                delay: this.defenderTypes.tree.moneyInterval,
                callback: () => {
                    this.currentMoney += this.defenderTypes.tree.moneyAmount;
                    this.updateMoneyText();
                    
                    // Visual feedback
                    this.add.text(tree.x, tree.y - 20, `+$${this.defenderTypes.tree.moneyAmount}`, {
                        fontSize: '16px',
                        fill: '#00ff00'
                    }).setDepth(100).setOrigin(0.5, 0)
                    .setAlpha(1)
                    .setData('created', Date.now());
                },
                callbackScope: this,
                loop: true
            });
        }
    }
  }

  placePoppyOnGrid(pointerX, pointerY) {
    const gridX = Math.floor(pointerX / this.gridConfig.cellWidth);
    const gridY = Math.floor((pointerY - 80) / this.gridConfig.cellHeight);
    const centerX = gridX * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2;
    const snappedY = gridY * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2 + 80;

    if (this.checkGridOccupied(centerX, snappedY)) return;

    if (snappedY >= 80 && snappedY <= this.gridConfig.height) {
        if (this.currentMoney >= this.defenderTypes.poppy.cost) {
            this.currentMoney -= this.defenderTypes.poppy.cost;
            this.updateMoneyText();

            const poppy = this.poppyGroup.create(centerX, snappedY, "poppy")
                .setScale(this.defenderTypes.poppy.scale);
            
            poppy.nextShootTime = this.time.now;
            poppy.range = this.defenderTypes.poppy.shootRange;
        }
    }
  }

  // Add this new helper method
  checkGridOccupied(x, y) {
    const tolerance = 10;
    return this.aaronGroup.getChildren().some(aaron => 
        Math.abs(aaron.x - x) < tolerance && Math.abs(aaron.y - y) < tolerance
    ) || this.eaterGroup.getChildren().some(eater => 
        Math.abs(eater.x - x) < tolerance && Math.abs(eater.y - y) < tolerance
    ) || this.treeGroup.getChildren().some(tree => 
        Math.abs(tree.x - x) < tolerance && Math.abs(tree.y - y) < tolerance
    ) || this.poppyGroup.getChildren().some(poppy => 
        Math.abs(poppy.x - x) < tolerance && Math.abs(poppy.y - y) < tolerance
    );
  }


  // --- Enemy Handling ---

  // spawnPollution() {
  //   const lane = Phaser.Math.Between(0, 4);
  //   const y = this.laneYPositions[lane];
  //   const enemy = this.pollutionGroup.create(960, y, "trashcanEnemy").setScale(0.75);

  //   // Enemy properties
  //   enemy.setVelocityX(this.currentEnemySpeed);
  //   enemy.health = this.enemyHealth;
  //   enemy.isPaused = false; // General paused state
  //   enemy.pauseTimer = null; // Not used for Eater pause
  //   enemy.originalVelocityX = this.currentEnemySpeed; // Store initial speed
  //   enemy.eatingAaron = null; // Reference to the Aaron it's eating
  //   enemy.pausedByEater = null; // NEW: Reference to the Eater that paused it

  //   console.log('Spawning enemy:', enemy.texture.key, 'at', enemy.x, enemy.y);
  // }

  destroyEnemy(enemy) {
    if (!enemy || !enemy.active) return; // Check if enemy exists and is active

    console.log('Destroying enemy:', enemy.texture.key, 'at', enemy.x, enemy.y);

    // Ensure interactions are cleaned up
    this.stopEatingAaron(enemy); // If it was eating Aaron, reset Aaron's state

    // MODIFIED: Clear eater pause reference before destroying
    if (enemy.pausedByEater) {
        // No need to tell the eater, just clear the enemy's state
        enemy.pausedByEater = null;
    }

    enemy.destroy();
  }
  spawnPollution() {
    const lane = Phaser.Math.Between(0, 4);
    const y = this.laneYPositions[lane];
    
    // Randomly select enemy type
    const enemyTypes = Object.values(this.enemyTypes);
    const selectedType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
    
    const enemy = this.pollutionGroup.create(960, y, selectedType.key)
        .setScale(selectedType.scale);

    // Enemy properties
    enemy.setVelocityX(selectedType.speed * this.currentEnemySpeed / this.initialEnemySpeed);
    enemy.health = selectedType.health;
    enemy.isPaused = false;
    enemy.pauseTimer = null;
    enemy.originalVelocityX = enemy.body.velocity.x;
    enemy.eatingAaron = null;
    enemy.pausedByEater = null;
    enemy.type = selectedType.key;

    console.log('Spawning enemy:', enemy.type, 'at', enemy.x, enemy.y);
  }

  // --- Collision/Overlap Handlers ---

  
  hitEnemy(projectile, enemy) {
    if (!enemy || !enemy.active || !projectile || !projectile.active) return; // Defensive checks

    projectile.destroy(); // Projectile is consumed
    enemy.health -= this.projectileDamage;
    console.log('Enemy hit. New health:', enemy.health);

    if (enemy.health <= 0) {
      // No need to call stopEatingAaron here, destroyEnemy handles it
      this.destroyEnemy(enemy);
    }
  }

  handleEnemyAaronCollision(enemy, aaron) {
    // Check if entities are valid and if Aaron is already being eaten by *another* enemy,
    // or if this enemy is already eating *this* Aaron.
    if (!enemy || !enemy.active || !aaron || !aaron.active || aaron.isBeingEaten || enemy.eatingAaron === aaron) {
      return;
    }
    // Also check if enemy is paused by an Eater - Aaron collision should still happen
    // but maybe prioritize? For now, let Aaron collision proceed.

    console.log('Enemy (', enemy.texture.key, ') starting to eat Aaron (ID:', aaron.getData('id'), ')');
    enemy.setVelocityX(0); // Stop the enemy
    enemy.isPaused = true; // Mark as paused (generic)
    enemy.eatingAaron = aaron; // Link enemy to Aaron

    aaron.isBeingEaten = true; // Mark Aaron as being eaten
    aaron.eatingEnemy = enemy; // Link Aaron to enemy

    const aaronId = aaron.getData('id');

    // Start timer to destroy Aaron if it hasn't been started already
    if (!aaron.destroyTimer) {
      console.log('Setting destroy timer for Aaron ID:', aaronId);
      aaron.destroyTimer = this.time.delayedCall(this.aaronDestroyDelay, () => {
        // Find the Aaron again by ID in case the reference became stale
        const currentAaron = this.aaronGroup.getChildren().find(child => child.getData('id') === aaronId);
        if (currentAaron && currentAaron.active && currentAaron.isBeingEaten) { // Check it's still being eaten
          console.log('Aaron (ID:', aaronId, ') destroy timer finished.');
          this.destroyAaron(currentAaron);
          this.sound.play('deadSound', { volume: 1 });
        } else {
             console.log('Aaron (ID:', aaronId, ') destroy timer finished, but Aaron is gone or no longer being eaten.');
        }
      }, null, this);
    }
  }

  // NEW: Central handler for Eater/Enemy overlap
  handleEaterEnemyOverlap(eater, enemy) {
    if (!eater || !eater.active || !enemy || !enemy.active) return; // Basic checks

    // PRIORITIZE: If enemy is busy eating Aaron, the Eater cannot interact
    if (enemy.eatingAaron) {
        // console.log(`Eater at (${eater.x}, ${eater.y}) ignored enemy eating Aaron.`); // Optional log
        return;
    }

    // Check if Eater is ready to eat
    if (this.time.now >= eater.nextEatTime) {
        // Eater is ready
        console.log(`Eater at (${eater.x}, ${eater.y}) is ready. Eating enemy.`);
        this.sound.play('munch', { volume: 1 });
        eater.nextEatTime = this.time.now + eater.eatCooldown; // Reset cooldown

        // MODIFIED: Ensure enemy state is reset before destroying
        if (enemy.pausedByEater === eater) {
            enemy.pausedByEater = null; // Clear the flag
            enemy.isPaused = false; // Reset general pause state (though it's about to be destroyed)
        }
        this.destroyEnemy(enemy); // Destroy the enemy

    } else {
        // Eater is on cooldown - PAUSE the enemy if not already paused by *this* eater
        if (!enemy.isPaused || enemy.pausedByEater !== eater) {
            // Check if it's paused, but not by THIS eater, or not paused at all
            // Do not pause if already paused by this specific eater
            console.log(`Eater at (${eater.x}, ${eater.y}) on cooldown. Pausing enemy.`);
            enemy.setVelocityX(0);       // Stop movement
            enemy.isPaused = true;       // Set general pause flag
            enemy.pausedByEater = eater; // Mark which eater paused it
        }
        // else: Enemy is already paused by this eater, just continue waiting.
        // Optional log for debugging cooldown:
        // console.log(`Eater at (${eater.x}, ${eater.y}) cooldown. Ready in ${Math.ceil((eater.nextEatTime - this.time.now) / 1000)}s`);
    }
  }


  // --- State Reset/Cleanup ---

  stopEatingAaron(enemy) {
    // Called when the enemy dies or moves away *before* Aaron is destroyed
    if (enemy && enemy.eatingAaron) {
      const aaron = enemy.eatingAaron;
      console.log('Enemy (', enemy.texture.key, ') stopped eating Aaron (ID:', aaron ? aaron.getData('id') : 'unknown', ')');

      if (aaron && aaron.active) {
        aaron.isBeingEaten = false;
        aaron.eatingEnemy = null;
        // IMPORTANT: Cancel the Aaron destruction timer if the enemy stops eating it!
        if (aaron.destroyTimer) {
          console.log('Cancelling destroy timer for Aaron (ID:', aaron.getData('id'), ') because enemy stopped eating.');
          aaron.destroyTimer.remove(false); // Remove timer without firing callback
          aaron.destroyTimer = null;
        }
      }
      // Reset enemy state
      enemy.eatingAaron = null;
      // Only resume velocity if it's NOT paused by an Eater
      if (!enemy.pausedByEater) {
          enemy.setVelocityX(enemy.originalVelocityX);
          enemy.isPaused = false;
      } else {
          // If it's paused by an Eater, keep it paused (velocity 0)
          enemy.setVelocityX(0);
          enemy.isPaused = true; // Ensure it stays marked as paused
          console.log('Enemy stopped eating Aaron but remains paused by an Eater.');
      }
    }
  }

  destroyAaron(aaron) {
    if (!aaron || !aaron.active) {
      // console.log('Attempting to destroy an invalid Aaron.'); // Optional log
      return;
    }
    const aaronId = aaron.getData('id');
    console.log('Destroying Aaron with ID:', aaronId, 'at', aaron.x, aaron.y);

    // If this Aaron was being eaten, tell the enemy to resume its movement
    if (aaron.eatingEnemy) {
      const enemy = aaron.eatingEnemy;
      if (enemy && enemy.active && enemy.eatingAaron === aaron) {
         console.log('Aaron destroyed, telling enemy (', enemy.texture.key, ') to resume.');
         enemy.eatingAaron = null; // Unlink enemy
         // Resume movement ONLY if not paused by an Eater
         if (!enemy.pausedByEater) {
             enemy.setVelocityX(enemy.originalVelocityX);
             enemy.isPaused = false;
         } else {
             // Keep paused by Eater
             enemy.setVelocityX(0);
             enemy.isPaused = true;
             console.log('Enemy resuming check after Aaron destroyed, but remains paused by Eater.');
         }
      }
    }

    // Cancel timer just in case (though it should have fired to call this)
    if (aaron.destroyTimer) {
        aaron.destroyTimer.remove(false);
        aaron.destroyTimer = null;
    }

    aaron.destroy();
  }


  // --- Game Mechanics (Money, Spawning, Speed) ---

  startMoneyTickTimer() {
    // Ensure no duplicate timers
    if (this.moneyTickTimer) {
        this.moneyTickTimer.remove();
    }
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

  updateMoneyText() {
    if (this.moneyText) {
      this.moneyText.setText(`Money: $${this.currentMoney}`);
      // NEW: Update menu item affordability indication (optional)
      this.updateMenuAffordability();
    }
  }

  // NEW: Optional visual feedback for affordability
  updateMenuAffordability() {
      if (this.aaronMenuIcon) {
          this.aaronMenuIcon.setAlpha(this.currentMoney >= this.aaronCost ? 1 : 0.5);
          this.aaronPriceText.setFill(this.currentMoney >= this.aaronCost ? '#fff' : '#ff8888'); // White or reddish
      }
      if (this.eaterMenuIcon) {
          this.eaterMenuIcon.setAlpha(this.currentMoney >= this.eaterCost ? 1 : 0.5);
          this.eaterPriceText.setFill(this.currentMoney >= this.eaterCost ? '#fff' : '#ff8888'); // White or reddish
      }
  }


  startEnemySpawnTimer(delay) {
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.remove(); // Use remove() instead of destroy() for timers
    }
    this.enemySpawnTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnPollution,
      callbackScope: this,
      loop: true,
    });
     console.log('Enemy spawn timer started with delay:', delay);
  }

  increaseSpawnRate() {
    this.currentSpawnDelay *= this.spawnRateIncreaseFactor;
    if (this.currentSpawnDelay < this.minSpawnDelay) {
      this.currentSpawnDelay = this.minSpawnDelay;
    }
    // Restart the timer with the new delay
    this.startEnemySpawnTimer(this.currentSpawnDelay);
  }

  increaseEnemySpeed() {
    this.currentEnemySpeed *= this.enemySpeedIncreaseFactor;
    console.log('Increasing enemy speed to:', this.currentEnemySpeed);
    // Update speed for all existing enemies that are *not* currently paused
    this.pollutionGroup.children.iterate(enemy => {
      if (enemy && enemy.active) {
         // Update the base speed
         enemy.originalVelocityX = this.currentEnemySpeed;
         // Only apply if not paused
         if (!enemy.isPaused) {
             enemy.setVelocityX(this.currentEnemySpeed);
         }
      }
    });
  }

  shootProjectile(aaron) {
    if (!aaron || !aaron.active || aaron.isBeingEaten) return; // Don't shoot if being eaten

    const projectile = this.projectileGroup.create(
        aaron.x + (aaron.displayWidth * 0.5), // Start projectile from front of Aaron
        aaron.y,
        "projectile"
    ).setScale(1.5);
    projectile.setVelocityX(this.projectileSpeed); // Updated projectile speed
    // Optional: Add timer to destroy projectile if it goes off-screen
    projectile.lifespan = 2500; // Reduced from 3000
     this.time.delayedCall(projectile.lifespan, () => {
         if(projectile.active) projectile.destroy();
     });
  }

  // --- Update Loop ---

  update(time, delta) { // Phaser passes time and delta to update

    // --- Enemy Updates ---
    this.pollutionGroup.children.iterate((enemy) => {
      if (enemy && enemy.active) {
        // 1. Check for reaching the left edge (Defeat Condition)
        if (enemy.x < 10) {
          console.log("Enemy reached the end!");
          this.scene.start("DefeatScene");
          // Could add sound effect here
          return; // Stop processing this enemy
        }

        // 2. Check if the Aaron it was eating got destroyed
        if (enemy.eatingAaron && !enemy.eatingAaron.active) {
          console.log('Update: Enemy (', enemy.texture.key, ') was eating an Aaron which is now inactive. Resuming...');
          enemy.eatingAaron = null; // Clear reference
          // Resume movement ONLY if not paused by an Eater
          if (!enemy.pausedByEater) {
             enemy.setVelocityX(enemy.originalVelocityX);
             enemy.isPaused = false;
          } else {
             // Keep paused state due to Eater
             enemy.setVelocityX(0);
             enemy.isPaused = true;
              console.log('Enemy resuming check after Aaron destroyed, but remains paused by Eater.');
          }
        }

        // 3. NEW/IMPLICIT: Check for resuming from Eater pause is handled by handleEaterEnemyOverlap
        // No explicit check needed here for Eater pause timeout, as the overlap handler deals with it when the cooldown ends.

      }
    });

    // --- Aaron Updates ---
    this.aaronGroup.children.iterate((aaron) => {
      if (aaron && aaron.active && !aaron.isBeingEaten) {
        // Shoot projectiles if not being eaten and cooldown is ready
        if (time > aaron.nextShootTime) { // Use the 'time' parameter from update
          this.shootProjectile(aaron);
          this.sound.play('pew', { volume: 0.5 }); // Lower volume maybe
          // Set next shoot time (random interval)
          aaron.nextShootTime = time + Phaser.Math.Between(this.minShootInterval, this.maxShootInterval);
        }
      }
      // Cleanup check: Destroy Aaron if its eatingEnemy becomes inactive (e.g., killed by turbine)
      // This is a safety check, should ideally be handled when enemy is destroyed.
      // if (aaron && aaron.active && aaron.isBeingEaten && (!aaron.eatingEnemy || !aaron.eatingEnemy.active)) {
      //    console.log("Aaron's eating enemy disappeared. Resetting Aaron state.");
      //    aaron.isBeingEaten = false;
      //    aaron.eatingEnemy = null;
      //    if (aaron.destroyTimer) {
      //       aaron.destroyTimer.remove(false);
      //       aaron.destroyTimer = null;
      //    }
      // }

    });

     // --- Eater Updates ---
     // No specific update logic needed for Eaters themselves in the main loop currently
     // Their eating logic is handled entirely by the handleEaterEnemyOverlap callback.

     // --- Projectile Updates ---
     // Destroy projectiles that go off-screen right
     this.projectileGroup.children.iterate((projectile) => {
         if (projectile && projectile.active && projectile.x > this.gridConfig.width + 20) {
             projectile.destroy();
         }
     });

    // Poppy shooting logic
    this.poppyGroup.children.iterate((poppy) => {
        if (poppy && poppy.active && time > poppy.nextShootTime) {
            // Find closest enemy within range
            let closestEnemy = null;
            let closestDistance = poppy.range;

            this.pollutionGroup.children.iterate((enemy) => {
                if (enemy && enemy.active) {
                    const distance = Phaser.Math.Distance.Between(poppy.x, poppy.y, enemy.x, enemy.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            });

            if (closestEnemy) {
                const projectile = this.projectileGroup.create(poppy.x, poppy.y, "projectile")
                    .setScale(1.5);
                
                const angle = Phaser.Math.Angle.Between(poppy.x, poppy.y, closestEnemy.x, closestEnemy.y);
                const velocity = new Phaser.Math.Vector2();
                velocity.setToPolar(angle, this.projectileSpeed);
                
                projectile.setVelocity(velocity.x, velocity.y);
                projectile.damage = this.defenderTypes.poppy.projectileDamage;
                
                this.sound.play('pew', { volume: 0.3 });
                poppy.nextShootTime = time + this.defenderTypes.poppy.shootInterval;
            }
        }
    });

    // Clean up floating money text
    this.children.each((child) => {
        if (child.type === 'Text' && child.getData('created')) {
            const age = Date.now() - child.getData('created');
            if (age > 1000) {
                child.destroy();
            } else {
                child.y -= 0.5;
                child.setAlpha(1 - (age / 1000));
            }
        }
    });
  }

}


