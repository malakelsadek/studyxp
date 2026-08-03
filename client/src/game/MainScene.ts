import Phaser from "phaser";
import type { PlayerDTO } from "../socket/types";
import { colorForPlayerId } from "./playerColor";

const DEFAULT_LOCAL_COLOR = 0x4ade80;
const MOVE_EMIT_INTERVAL_MS = 60;
const BUBBLE_DURATION_MS = 8000;
export const FONT_FAMILY = "'Courier New', Courier, monospace";

function isTypingInFormField(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

interface PlayerVisual {
  rect: Phaser.GameObjects.Rectangle;
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
  private onLocalMove?: (x: number, y: number) => void;
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

    this.localVisual = this.createVisual(width / 2, height / 2, DEFAULT_LOCAL_COLOR, this.selfDisplayName, true);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.disableGlobalCapture();
  }

  update(time: number) {
    if (!this.localVisual || !this.cursors) return;
    const body = this.localVisual.rect.body as Phaser.Physics.Arcade.Body;
    const speed = 200;

    body.setVelocity(0);
    if (!isTypingInFormField()) {
      if (this.cursors.left.isDown) body.setVelocityX(-speed);
      else if (this.cursors.right.isDown) body.setVelocityX(speed);
      if (this.cursors.up.isDown) body.setVelocityY(-speed);
      else if (this.cursors.down.isDown) body.setVelocityY(speed);
    }

    this.updateVisualPositions(this.localVisual);

    const { x, y } = this.localVisual.rect;
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

  setSelf(id: string, displayName: string) {
    this.selfId = id;
    this.selfDisplayName = displayName;
    if (this.localVisual) {
      this.localVisual.label.setText(displayName);
      this.localVisual.rect.setFillStyle(colorForPlayerId(id));
    }
  }

  showChatBubble(playerId: string, text: string) {
    const visual = playerId === this.selfId ? this.localVisual : this.otherVisuals.get(playerId);
    if (!visual) return;

    visual.bubble?.destroy();
    visual.bubbleTimer?.remove();

    visual.bubble = this.add.text(visual.rect.x, 0, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: "#111111",
      backgroundColor: "#ffffff",
      padding: { x: 6, y: 4 },
      wordWrap: { width: 160 },
    });
    visual.bubble.setOrigin(0.5, 1);
    visual.bubble.setDepth(20);
    this.updateVisualPositions(visual);

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
        visual = this.createVisual(player.x, player.y, colorForPlayerId(player.id), player.displayName);
        this.otherVisuals.set(player.id, visual);
      } else {
        visual.rect.setPosition(player.x, player.y);
        visual.label.setText(player.displayName);
        this.updateVisualPositions(visual);
      }
    }

    for (const [id, visual] of this.otherVisuals) {
      if (!seen.has(id)) {
        visual.rect.destroy();
        visual.label.destroy();
        visual.bubble?.destroy();
        visual.bubbleTimer?.remove();
        this.otherVisuals.delete(id);
      }
    }
  }

  private createVisual(x: number, y: number, color: number, name: string, withPhysics = false): PlayerVisual {
    const rect = this.add.rectangle(x, y, 32, 32, color);
    if (withPhysics) {
      this.physics.add.existing(rect);
    }
    const label = this.add.text(x, y - 24, name, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#00000080",
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 1);
    return { rect, label };
  }

  private updateVisualPositions(visual: PlayerVisual) {
    visual.label.setPosition(visual.rect.x, visual.rect.y - 24);
    visual.bubble?.setPosition(visual.rect.x, visual.rect.y - 40);
  }
}
