

export default class DefeatScene extends Phaser.Scene {
    constructor() {
        super({ key: "DefeatScene" });
    }
    preload() {
        // Load the audio file
        this.load.audio('defeatSound', '/assets/defeat.m4a'); // Adjust path as needed
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background with subtle animation
        const background = this.add.graphics();
        background.fillStyle(0x111111, 1); // Darker background
        background.fillRect(0, 0, width, height);

        // Create a few color properties to be used in the scene
        this.bgColors = [0x8B0000, 0xB22222, 0xFF4500, 0xFF6347]; // DarkRed, Firebrick, OrangeRed, Tomato
        this.bgColorIndex = 0;
        this.textColors = ['#DC143C', '#FF6347', '#FF4500', '#FF8C00']; // Crimson, Tomato, OrangeRed, DarkOrange
        this.textColorIndex = 0;

        // Timer to change background color
        this.time.addEvent({
            delay: 500, // Change every half second
            callback: () => {
                this.bgColorIndex = (this.bgColorIndex + 1) % this.bgColors.length;
                background.fillStyle(this.bgColors[this.bgColorIndex], 1);
                background.fillRect(0, 0, width, height); //redraw
            },
            loop: true
        });

        // Defeat text with gradient and outline
        const defeatText = this.add.text(width / 2, height / 2 - 50, "DEFEAT", {
            fontFamily: 'Arial Black',
            fontSize: 80,  // Increased size
            color: this.textColors[this.textColorIndex], // Start with a color
            stroke: '#000000',
            strokeThickness: 12, // Increased thickness
            align: 'center',
            shadow: { //added shadow
                offsetX: 5,
                offsetY: 5,
                color: '#000000',
                blur: 8,
                fill: false
            }
        }).setOrigin(0.5);

        // Timer to change text color
        this.time.addEvent({
            delay: 750,
            callback: () => {
                this.textColorIndex = (this.textColorIndex + 1) % this.textColors.length;
                defeatText.setStyle({ color: this.textColors[this.textColorIndex] });
            },
            loop: true
        });


        // Message text
        this.add.text(width / 2, height / 2 + 30, "Pollution took over", { // Increased spacing
            fontFamily: 'Arial',
            fontSize: 28, // Increased size
            color: '#ffffff',
            align: 'center',
            shadow: { // Added shadow
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                fill: false
            }
        }).setOrigin(0.5);

        // Restart button with enhanced style
        const restartButton = this.add.text(width / 2, height / 2 + 120, "Try Again", { // Increased spacing
            fontFamily: 'Arial Black',
            fontSize: 36, // Increased size
            color: '#ffffff',
            backgroundColor: '#FF4500', // A brighter color
            padding: { x: 30, y: 15 }, // Increased padding
            borderRadius: 10, // More rounded
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#8B0000',  // Darker shadow
                blur: 6,
                fill: false
            },
            stroke: '#B22222', // Added outline
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.start("GameScene");
        });

        restartButton.on('pointerover', () => {
            restartButton.setStyle({
                backgroundColor: '#FF6347', // Lighter shade on hover
                shadowColor: '#B22222',
                scale: 1.05, // Slight scale increase on hover
            });
        });

        restartButton.on('pointerout', () => {
            restartButton.setStyle({
                backgroundColor: '#FF4500',
                shadowColor: '#8B0000',
                scale: 1,
            });
        });
        this.sound.play('defeatSound')
    }

    update() {
        // Any updates for the defeat scene can go here
    }
}