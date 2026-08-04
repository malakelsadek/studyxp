import Phaser from "phaser";
import type { PlayerDTO } from "../socket/types";
import { getCharacterPreset } from "./characterPresets";

const MOVE_EMIT_INTERVAL_MS = 60;
const BUBBLE_DURATION_MS = 8000;
const CHAR_WIDTH = 22;
const CHAR_HEIGHT = 36;
export const FONT_FAMILY = "'Courier New', Courier, monospace";

function isTypingInFormField(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  head: Phaser.GameObjects.Rectangle;
  hair: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  bubble?: Phaser.GameObjects.Text;
  bubbleTimer?: Phaser.Time.TimerEvent;
}

export class MainScene extends Phaser.Scene {
  private localVisual?: PlayerVisual;
  private otherVisuals = new Map<string, PlayerVisual>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
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
    this.load.image("map", "/assets/map.png");
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(0, 0, "map").setOrigin(0, 0).setDisplaySize(width, height);

    this.add
      .text(16, 16, "StudyXP — Lobby", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#ffffff" })
      .setDepth(10);

    this.localVisual = this.createVisual(width / 2, height / 2, this.selfCharacter, this.selfDisplayName, true);
    this.localVisual.container.on("pointerdown", () => {
      if (this.selfId) this.onPlayerClick?.(this.selfId);
    });

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.disableGlobalCapture();
  }

  update(time: number) {
    if (!this.localVisual || !this.cursors) return;
    const body = this.localVisual.container.body as Phaser.Physics.Arcade.Body;
    const speed = 200;

    body.setVelocity(0);
    if (!isTypingInFormField()) {
      if (this.cursors.left.isDown) body.setVelocityX(-speed);
      else if (this.cursors.right.isDown) body.setVelocityX(speed);
      if (this.cursors.up.isDown) body.setVelocityY(-speed);
      else if (this.cursors.down.isDown) body.setVelocityY(speed);
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
    const preset = getCharacterPreset(character);

    const body = this.add.rectangle(0, 9, 20, 18, preset.outfit);
    const head = this.add.rectangle(0, -8, 16, 14, preset.skin);
    const hair = this.add.rectangle(0, -16, 18, 6, preset.hair);

    const container = this.add.container(x, y, [body, head, hair]);
    container.setSize(CHAR_WIDTH, CHAR_HEIGHT);
    container.setInteractive({ useHandCursor: true });

    if (withPhysics) {
      this.physics.add.existing(container);
    }
    if (clickId) {
      container.on("pointerdown", () => this.onPlayerClick?.(clickId));
    }

    const label = this.add.text(x, y - 27, name, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#00000080",
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 1);

    return { container, body, head, hair, label };
  }

  private applyCharacter(visual: PlayerVisual, character: string) {
    const preset = getCharacterPreset(character);
    visual.body.setFillStyle(preset.outfit);
    visual.head.setFillStyle(preset.skin);
    visual.hair.setFillStyle(preset.hair);
  }

  private updateAttachments(visual: PlayerVisual) {
    visual.label.setPosition(visual.container.x, visual.container.y - 27);
    visual.bubble?.setPosition(visual.container.x, visual.container.y - 43);
  }
}
