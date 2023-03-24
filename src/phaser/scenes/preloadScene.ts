// Part: src/phaser/scenes/preloadScene.ts

import Phaser from 'phaser';
import { config } from '@src/core/config';

export default class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Load assets here
    this.load.svg('player', 'assets/player.svg', { width: 20, height: 20 });
    this.load.svg('starry_night', 'assets/starry_night.svg', {
      width: 800,
      height: 600,
    });
    this.load.svg('forest_silhouette', 'assets/forest_silhouette.svg', {
      width: 800,
      height: 600,
    });
    this.load.svg('PostApoc_title', 'assets/PostApoc_title.svg', {
      width: 800,
      height: 100,
    });
    this.load.svg('mushroom_cloud', 'assets/mushroom_cloud.svg', {
      width: 100,
      height: 100,
    });

    // Set up the progress bar
    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(240, 290, 320, 20);

    // Set up the background for the progress bar
    const backgroundBar = this.add.graphics();
    backgroundBar.lineStyle(4, 0xffffff, 1);
    backgroundBar.strokeRect(240, 290, 320, 20);

    // Update the progress bar during loading
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xffffff, 1);
      this.progressBar.fillRect(240, 290, 320 * value, 20);
    });
  }

  create() {
    // Show the starry night background
    this.add.image(400, 300, 'starry_night');

    // Show the silhouette of a forest at the bottom
    const forestSilhouette = this.add.image(400, 300, 'forest_silhouette');
    forestSilhouette.setScale(1);

    // Show the title "PostApoc" in the foreground
    const title = this.add.image(400, 150, 'PostApoc_title');
    title.setScale(2);

    // Set up input listeners
    this.input.on('pointerdown', () => this.startMainScene());
    this.input.keyboard.on('keydown', () => this.startMainScene());

    if (config.developmentMode) {
      this.scene.start('MainScene');
    }
  }

  private async startMainScene() {
    await this.growMushroomCloud();
    this.scene.start('MainScene');
  }

  private async growMushroomCloud() {
    return new Promise<void>((resolve) => {
      const mushroomCloud = this.add.image(400, 300, 'mushroom_cloud');
      mushroomCloud.setScale(0.1).setDepth(1);
      mushroomCloud.originY = mushroomCloud.height;
      this.tweens.add({
        targets: mushroomCloud,
        scale: 20,
        duration: 2000,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          resolve();
        },
      });

      // Add the screen overlay
      const orangeRect = this.add.rectangle(400, 300, 800, 600, 0xff6600, 0);
      orangeRect.setDepth(2);

      const blackRect = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
      blackRect.setDepth(3);

      this.tweens.add({
        targets: orangeRect,
        fillAlpha: 0.5,
        duration: 800,
        ease: 'Linear',
        onComplete: () => {
          this.tweens.add({
            targets: blackRect,
            fillAlpha: 1,
            duration: 1600,
            ease: 'Expo.easeOut',
            onComplete: () => {
              resolve();
            },
          });
        },
      });
    });
  }
}