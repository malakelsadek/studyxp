import Phaser from "phaser";
import type { PlayerDTO } from "../socket/types";
import { CHARACTER_PRESETS, type CharacterPose } from "./characterPresets";

const MOVE_EMIT_INTERVAL_MS = 60;
const BUBBLE_DURATION_MS = 21000;
const MAX_BUBBLES_PER_PLAYER = 3;
const BUBBLE_GAP = 6;
const SPRITE_DISPLAY_HEIGHT = 84 * 1.2;
const HIT_WIDTH = 56 * 1.2;
const MOVE_EPSILON = 0.5;
const DEFAULT_BACKGROUND_URL = "/assets/map.png";
export const FONT_FAMILY = "'Courier New', Courier, monospace";
const BUBBLE_FONT_FAMILY = "'Lato', 'Segoe UI', sans-serif";
const TYPING_FRAME_INTERVAL_MS = 650;
const TYPING_FRAMES = ["•", "• •", "• • •"];
export const WORLD_WIDTH = 1536;
export const WORLD_HEIGHT = 1024;

function isTypingInFormField(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function spriteKey(character: string, pose: CharacterPose): string {
  return `${character}:${pose}`;
}

function resolveDirectionFromDelta(dx: number, dy: number): CharacterPose {
  if (Math.abs(dx) < MOVE_EPSILON && Math.abs(dy) < MOVE_EPSILON) return "still";
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

interface Bubble {
  text: Phaser.GameObjects.Text;
  timer: Phaser.Time.TimerEvent;
}

interface TypingIndicator {
  text: Phaser.GameObjects.Text;
  timer: Phaser.Time.TimerEvent;
}

interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  character: string;
  direction: CharacterPose;
  bubbles: Bubble[];
  typingIndicator?: TypingIndicator;
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
      for (const [pose, url] of Object.entries(preset.sprites)) {
        this.load.image(spriteKey(preset.id, pose as CharacterPose), url);
      }
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.updateCameraZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.updateCameraZoom());

    this.backgroundImage = this.add
      .image(0, 0, "map")
      .setOrigin(0, 0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    this.localVisual = this.createVisual(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      this.selfCharacter,
      this.selfDisplayName,
      true,
    );
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
    let direction: CharacterPose = "still";
    if (!isTypingInFormField()) {
      const left = this.cursors.left.isDown || this.wasd?.left.isDown;
      const right = this.cursors.right.isDown || this.wasd?.right.isDown;
      const up = this.cursors.up.isDown || this.wasd?.up.isDown;
      const down = this.cursors.down.isDown || this.wasd?.down.isDown;

      if (left) body.setVelocityX(-speed);
      else if (right) body.setVelocityX(speed);
      if (up) body.setVelocityY(-speed);
      else if (down) body.setVelocityY(speed);

      if (left) direction = "left";
      else if (right) direction = "right";
      else if (up) direction = "up";
      else if (down) direction = "down";
    }

    if (direction !== this.localVisual.direction) {
      this.applyCharacter(this.localVisual, this.selfCharacter, direction);
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

  setTyping(playerId: string, isTyping: boolean) {
    const visual = playerId === this.selfId ? this.localVisual : this.otherVisuals.get(playerId);
    if (!visual) return;

    if (!isTyping) {
      if (visual.typingIndicator) {
        visual.typingIndicator.timer.remove();
        visual.typingIndicator.text.destroy();
        visual.typingIndicator = undefined;
        this.updateAttachments(visual);
      }
      return;
    }

    if (visual.typingIndicator) return;

    const text = this.add.text(visual.container.x, 0, TYPING_FRAMES[0], {
      fontFamily: BUBBLE_FONT_FAMILY,
      fontSize: "10px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "#00000090",
      padding: { x: 5, y: 3 },
    });
    text.setOrigin(0.5, 1);
    text.setDepth(20);

    let frameIndex = 0;
    const timer = this.time.addEvent({
      delay: TYPING_FRAME_INTERVAL_MS,
      loop: true,
      callback: () => {
        frameIndex = (frameIndex + 1) % TYPING_FRAMES.length;
        text.setText(TYPING_FRAMES[frameIndex]);
      },
    });

    visual.typingIndicator = { text, timer };
    this.updateAttachments(visual);
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
      this.applyCharacter(this.localVisual, character, this.localVisual.direction);
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

  private updateCameraZoom() {
    const { width, height } = this.scale;
    // A resize event can transiently report a zero-size container (e.g. mid layout
    // pass); zooming to 0 would collapse every sprite to an invisible point until the
    // next real resize. Skip it and keep whatever zoom was last valid.
    if (!width || !height) return;
    const zoom = Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    this.cameras.main.setZoom(zoom);
  }

  private applyBackgroundTexture(key: string) {
    this.backgroundImage?.setTexture(key);
    this.backgroundImage?.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
  }

  showChatBubble(playerId: string, text: string) {
    const visual = playerId === this.selfId ? this.localVisual : this.otherVisuals.get(playerId);
    if (!visual) return;

    if (visual.bubbles.length >= MAX_BUBBLES_PER_PLAYER) {
      const oldest = visual.bubbles.shift();
      oldest?.timer.remove();
      oldest?.text.destroy();
    }

    const bubbleText = this.add.text(visual.container.x, 0, text, {
      fontFamily: BUBBLE_FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
      color: "#111111",
      backgroundColor: "#ffffff",
      padding: { x: 8, y: 5 },
      wordWrap: { width: 200 },
    });
    bubbleText.setOrigin(0.5, 1);
    bubbleText.setDepth(20);
    bubbleText.setShadow(1, 1, "#00000066", 2, true, true);

    const timer = this.time.delayedCall(BUBBLE_DURATION_MS, () => {
      const index = visual.bubbles.findIndex((b) => b.text === bubbleText);
      if (index !== -1) visual.bubbles.splice(index, 1);
      bubbleText.destroy();
      this.updateAttachments(visual);
    });

    visual.bubbles.push({ text: bubbleText, timer });
    this.updateAttachments(visual);
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
        const dx = player.x - visual.container.x;
        const dy = player.y - visual.container.y;
        visual.container.setPosition(player.x, player.y);
        visual.label.setText(player.displayName);
        this.applyCharacter(visual, player.character, resolveDirectionFromDelta(dx, dy));
        this.updateAttachments(visual);
      }
    }

    for (const [id, visual] of this.otherVisuals) {
      if (!seen.has(id)) {
        visual.container.destroy();
        visual.label.destroy();
        for (const bubble of visual.bubbles) {
          bubble.timer.remove();
          bubble.text.destroy();
        }
        if (visual.typingIndicator) {
          visual.typingIndicator.timer.remove();
          visual.typingIndicator.text.destroy();
        }
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
    const sprite = this.add.image(0, 0, spriteKey(character, "still"));

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
      fontFamily: BUBBLE_FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "#00000090",
      padding: { x: 5, y: 3 },
    });
    label.setOrigin(0.5, 1);
    label.setShadow(1, 1, "#00000080", 1, true, true);

    const visual: PlayerVisual = { container, sprite, label, character, direction: "still", bubbles: [] };
    this.applyCharacter(visual, character, "still");
    return visual;
  }

  private applyCharacter(visual: PlayerVisual, character: string, direction: CharacterPose) {
    visual.character = character;
    visual.direction = direction;
    const key = spriteKey(character, direction);
    if (!this.textures.exists(key)) return;
    visual.sprite.setTexture(key);
    const frame = this.textures.get(key).getSourceImage() as HTMLImageElement;
    visual.sprite.setScale(SPRITE_DISPLAY_HEIGHT / frame.height);
  }

  private updateAttachments(visual: PlayerVisual) {
    visual.label.setPosition(visual.container.x, visual.container.y - SPRITE_DISPLAY_HEIGHT / 2 - 10);

    let cursorY = visual.container.y - SPRITE_DISPLAY_HEIGHT / 2 - 34;
    if (visual.typingIndicator) {
      visual.typingIndicator.text.setPosition(visual.container.x, cursorY);
      cursorY -= visual.typingIndicator.text.height + BUBBLE_GAP;
    }
    for (let i = visual.bubbles.length - 1; i >= 0; i--) {
      const bubble = visual.bubbles[i].text;
      bubble.setPosition(visual.container.x, cursorY);
      cursorY -= bubble.height + BUBBLE_GAP;
    }
  }
}
