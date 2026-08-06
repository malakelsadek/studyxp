import Phaser from "phaser";
import type { PlayerDTO } from "../socket/types";
import { CHARACTER_PRESETS } from "./characterPresets";

const MOVE_EMIT_INTERVAL_MS = 60;
const BUBBLE_DURATION_MS = 8000;
const SPRITE_NATIVE_HEIGHT = 160;
const SPRITE_DISPLAY_HEIGHT = 84;
const SPRITE_SCALE = SPRITE_DISPLAY_HEIGHT / SPRITE_NATIVE_HEIGHT;
const HIT_WIDTH = 56;
const DEFAULT_BACKGROUND_URL = "/assets/map.png";
export const FONT_FAMILY = "'Courier New', Courier, monospace";
export const WORLD_WIDTH = 1536;
export const WORLD_HEIGHT = 1024;

function isTypingInFormField(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  bubble?: Phaser.GameObjects.Text;
  bubbleTimer?: Phaser.Time.TimerEvent;
}

export class MainScene extends Phaser.Scene {
  private localVisual?: PlayerVisual;
  private otherVisuals = new Map<string, PlayerVisual>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private backgroundImage?: Phaser.GameObjects.Image;
  private selfId: string | null = null;
  private selfDisplayName = "You";
  private selfCharacter = "char-1";
  private onLocalMove?: (x: number, y: number) => void;
  private onPlayerClick?: (id: string) => void;
  private lastEmitAt = 0;
  private lastEmittedPos = { x: -1, y: -1 };

  constructor() {
    super("main");
  }

  preload() {
    this.load.image("map", DEFAULT_BACKGROUND_URL);
    for (const preset of CHARACTER_PRESETS) {
      this.load.image(preset.id, preset.spriteUrl);
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.backgroundImage = this.add
      .image(0, 0, "map")
      .setOrigin(0, 0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    this.localVisual = this.createVisual(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, this.selfCharacter, this.selfDisplayName, true);
    this.localVisual.container.on("pointerdown", () => {
      if (this.selfId) this.onPlayerClick?.(this.selfId);
    });

    const body = this.localVisual.container.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.localVisual.container, true, 0.12, 0.12);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({ up: "W", down: "S", left: "A", right: "D" }) as
      | Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>
      | undefined;
    this.input.keyboard?.disableGlobalCapture();
  }

  update(time: number) {
    if (!this.localVisual || !this.cursors) return;
    const body = this.localVisual.container.body as Phaser.Physics.Arcade.Body;
    const speed = 200;

    body.setVelocity(0);
    if (!isTypingInFormField()) {
      const left = this.cursors.left.isDown || this.wasd?.left.isDown;
      const right = this.cursors.right.isDown || this.wasd?.right.isDown;
      const up = this.cursors.up.isDown || this.wasd?.up.isDown;
      const down = this.cursors.down.isDown || this.wasd?.down.isDown;

      if (left) body.setVelocityX(-speed);
      else if (right) body.setVelocityX(speed);
      if (up) body.setVelocityY(-speed);
      else if (down) body.setVelocityY(speed);
    }

    this.updateAttachments(this.localVisual);

    const { x, y } = this.localVisual.container;
    const moved = Math.abs(x - this.lastEmittedPos.x) > 0.5 || Math.abs(y - this.lastEmittedPos.y) > 0.5;
    if (moved && time - this.lastEmitAt > MOVE_EMIT_INTERVAL_MS) {
      this.lastEmitAt = time;
      this.lastEmittedPos = { x, y };
      this.onLocalMove?.(x, y);
    }
  }

  setOnLocalMove(cb: (x: number, y: number) => void) {
    this.onLocalMove = cb;
  }

  setOnPlayerClick(cb: (id: string) => void) {
    this.onPlayerClick = cb;
  }

  setSelf(id: string, displayName: string, character: string) {
    this.selfId = id;
    this.selfDisplayName = displayName;
    this.selfCharacter = character;
    if (this.localVisual) {
      this.localVisual.label.setText(displayName);
      this.applyCharacter(this.localVisual, character);
    }
  }

  setBackground(url: string | null) {
    const targetUrl = url ?? DEFAULT_BACKGROUND_URL;
    const key = url ? `bg-custom-${url}` : "map";

    if (this.textures.exists(key)) {
      this.applyBackgroundTexture(key);
      return;
    }

    this.load.image(key, targetUrl);
    this.load.once(`filecomplete-image-${key}`, () => this.applyBackgroundTexture(key));
    this.load.start();
  }

  private applyBackgroundTexture(key: string) {
    this.backgroundImage?.setTexture(key);
    this.backgroundImage?.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
  }

  showChatBubble(playerId: string, text: string) {
    const visual = playerId === this.selfId ? this.localVisual : this.otherVisuals.get(playerId);
    if (!visual) return;

    visual.bubble?.destroy();
    visual.bubbleTimer?.remove();

    visual.bubble = this.add.text(visual.container.x, 0, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: "#111111",
      backgroundColor: "#ffffff",
      padding: { x: 6, y: 4 },
      wordWrap: { width: 160 },
    });
    visual.bubble.setOrigin(0.5, 1);
    visual.bubble.setDepth(20);
    this.updateAttachments(visual);

    visual.bubbleTimer = this.time.delayedCall(BUBBLE_DURATION_MS, () => {
      visual.bubble?.destroy();
      visual.bubble = undefined;
      visual.bubbleTimer = undefined;
    });
  }

  syncPlayers(players: Record<string, PlayerDTO>) {
    const seen = new Set<string>();

    for (const player of Object.values(players)) {
      if (player.id === this.selfId) continue;
      seen.add(player.id);

      let visual = this.otherVisuals.get(player.id);
      if (!visual) {
        visual = this.createVisual(player.x, player.y, player.character, player.displayName, false, player.id);
        this.otherVisuals.set(player.id, visual);
      } else {
        visual.container.setPosition(player.x, player.y);
        visual.label.setText(player.displayName);
        this.applyCharacter(visual, player.character);
        this.updateAttachments(visual);
      }
    }

    for (const [id, visual] of this.otherVisuals) {
      if (!seen.has(id)) {
        visual.container.destroy();
        visual.label.destroy();
        visual.bubble?.destroy();
        visual.bubbleTimer?.remove();
        this.otherVisuals.delete(id);
      }
    }
  }

  private createVisual(
    x: number,
    y: number,
    character: string,
    name: string,
    withPhysics = false,
    clickId?: string,
  ): PlayerVisual {
    const sprite = this.add.image(0, 0, character).setScale(SPRITE_SCALE);

    const container = this.add.container(x, y, [sprite]);
    container.setSize(HIT_WIDTH, SPRITE_DISPLAY_HEIGHT);
    container.setInteractive({ useHandCursor: true });

    if (withPhysics) {
      this.physics.add.existing(container);
    }
    if (clickId) {
      container.on("pointerdown", () => this.onPlayerClick?.(clickId));
    }

    const label = this.add.text(x, y - SPRITE_DISPLAY_HEIGHT / 2 - 10, name, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#00000080",
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 1);

    return { container, sprite, label };
  }

  private applyCharacter(visual: PlayerVisual, character: string) {
    visual.sprite.setTexture(character);
  }

  private updateAttachments(visual: PlayerVisual) {
    visual.label.setPosition(visual.container.x, visual.container.y - SPRITE_DISPLAY_HEIGHT / 2 - 10);
    visual.bubble?.setPosition(visual.container.x, visual.container.y - SPRITE_DISPLAY_HEIGHT / 2 - 26);
  }
}
