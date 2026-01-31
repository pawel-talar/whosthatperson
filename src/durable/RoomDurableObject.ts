import { maskName } from "../utils/maskName";

type RoundStatus = "lobby" | "playing" | "roundEnd";

type Player = {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  connected: boolean;
};

type Guess = {
  playerId: string;
  playerName: string;
  answer: string;
  correct: boolean;
  timeMs: number;
  points: number;
};

type PersonRow = {
  id: string;
  name: string;
  category: string;
  occupation: string;
  hints: string;
};

type PersonData = {
  id: string;
  name: string;
  category: string;
  occupation: string;
  hints: string[];
};

type RoomState = {
  id: string;
  hostId: string | null;
  hostKey: string;
  players: Record<string, Player>;
  roundStatus: RoundStatus;
  selectedCategory: string;
  currentPerson: PersonData | null;
  visibleHints: number;
  guesses: Guess[];
  roundStartTime: number | null;
  roundDurationSec: number;
  totalRounds: number;
  remainingPersonIds: string[];
  roundHistory: { id: string; name: string }[];
  revealedName: string | null;
  hintIntervalSec: number;
  nextHintAt: number | null;
  lastHintRevealedAt: number | null;
  roundEndDelaySec: number;
  roundCorrectIds: string[];
};

type RoomPublic = {
  id: string;
  hostId: string | null;
  players: Player[];
  roundStatus: RoundStatus;
  selectedCategory: string;
  gameOver: boolean;
  currentRound: number;
  totalRounds: number;
  roundHistory: { id: string; name: string }[];
  visibleHints: number;
  hints: string[];
  occupation: string | null;
  guesses: Guess[];
  roundStartTime: number | null;
  roundDurationSec: number;
  revealedName: string | null;
  hintIntervalSec: number;
  nextHintAt: number | null;
};

type StoredState = {
  room: RoomState | null;
};

const createId = () => Math.random().toString(36).slice(2, 8);

const mapRow = (row: PersonRow): PersonData => ({
  id: row.id,
  name: row.name,
  category: row.category,
  occupation: row.occupation,
  hints: [maskName(row.name), ...(JSON.parse(row.hints) as string[])]
});

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private room: RoomState | null = null;
  private sockets = new Map<WebSocket, string>();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith("/init") && request.method === "POST") {
      return this.handleInit(request);
    }
    if (path.endsWith("/state") && request.method === "GET") {
      return this.handleState();
    }
    if (path.endsWith("/alarm") && request.method === "POST") {
      await this.alarm();
      return new Response("ok");
    }
    if (path.endsWith("/ws") && request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket();
    }

    return new Response("Not found", { status: 404 });
  }

  private getDb() {
    return this.env?.DB;
  }

  private async loadState() {
    if (this.room) return;
    const stored = (await this.state.storage.get<StoredState>("state")) ?? {
      room: null
    };
    this.room = stored.room;
  }

  private async saveState() {
    await this.state.storage.put("state", { room: this.room });
  }

  private async loadPersonById(id: string | null) {
    if (!id) return null;
    const db = this.getDb();
    if (!db) return null;
    const row = (await db
      .prepare("SELECT id, name, category, occupation, hints FROM persons WHERE id = ?1")
      .bind(id)
      .first()) as PersonRow | null;
    if (!row) return null;
    return mapRow(row);
  }

  private async loadQuizIds(totalRounds: number, category: string) {
    const db = this.getDb();
    if (!db) return [];
    const normalized = category.toLowerCase();
    const result =
      normalized === "mix"
        ? await db
            .prepare("SELECT id FROM persons ORDER BY RANDOM() LIMIT ?1")
            .bind(totalRounds)
            .all<{ id: string }>()
        : await db
            .prepare(
              "SELECT p.id FROM persons p JOIN person_category pc ON pc.person_id = p.id WHERE pc.category_code = ?1 ORDER BY RANDOM() LIMIT ?2"
            )
            .bind(normalized, totalRounds)
            .all<{ id: string }>();
    return (result.results ?? []).map((row) => row.id);
  }

  private toPublic(): RoomPublic {
    const room = this.room as RoomState;
    const person = room.currentPerson;
    const hints = person ? person.hints.slice(0, room.visibleHints) : [];
    const gameOver = room.roundStatus === "roundEnd" && room.remainingPersonIds.length === 0;
    const currentRound = Math.min(
      room.totalRounds,
      room.totalRounds - room.remainingPersonIds.length
    );

    return {
      id: room.id,
      hostId: room.hostId,
      players: Object.values(room.players),
      roundStatus: room.roundStatus,
      selectedCategory: room.selectedCategory,
      gameOver,
      currentRound,
      totalRounds: room.totalRounds,
      roundHistory: room.roundHistory,
      visibleHints: room.visibleHints,
      hints,
      occupation: person?.occupation ?? null,
      guesses: room.guesses,
      roundStartTime: room.roundStartTime,
      roundDurationSec: room.roundDurationSec,
      revealedName: room.revealedName,
      hintIntervalSec: room.hintIntervalSec,
      nextHintAt: room.nextHintAt
    };
  }

  private broadcast(payload: unknown) {
    const message = JSON.stringify(payload);
    this.sockets.forEach((_, socket) => {
      try {
        socket.send(message);
      } catch {
        this.sockets.delete(socket);
      }
    });
  }

  private broadcastRoomUpdate() {
    if (!this.room) return;
    this.broadcast({ type: "roomUpdate", payload: this.toPublic() });
  }

  private checkRoundTimeout() {
    if (!this.room || this.room.roundStatus !== "playing" || !this.room.roundStartTime) {
      return;
    }
    const elapsed = (Date.now() - this.room.roundStartTime) / 1000;
    if (elapsed < this.room.roundDurationSec) return;

    const person = this.room.currentPerson;
    this.room.roundStatus = "roundEnd";
    this.room.revealedName = person?.name ?? null;
    this.room.nextHintAt = null;
    this.room.lastHintRevealedAt = null;
  }

  private getRoundEndAt() {
    if (!this.room?.roundStartTime) return null;
    return this.room.roundStartTime + this.room.roundDurationSec * 1000;
  }

  private scheduleAlarm(nextAt: number | null) {
    const roundEndAt = this.getRoundEndAt();
    const alarmAt =
      roundEndAt && nextAt ? Math.min(roundEndAt, nextAt) : roundEndAt ?? nextAt;
    if (!alarmAt) return;
    this.state.storage.setAlarm(alarmAt).catch(() => undefined);
  }

  private scheduleNextHint() {
    if (!this.room || this.room.roundStatus !== "playing") return;
    const nextAt = Date.now() + this.room.hintIntervalSec * 1000;
    this.room.nextHintAt = nextAt;
    this.scheduleAlarm(nextAt);
  }

  private scheduleRoundEndDelay() {
    if (!this.room || this.room.roundStatus !== "playing") return;
    const nextAt = Date.now() + this.room.roundEndDelaySec * 1000;
    this.room.nextHintAt = nextAt;
    this.scheduleAlarm(nextAt);
  }

  private async handleInit(request: Request) {
    await this.loadState();
    if (this.room) {
      return new Response(JSON.stringify({ roomId: this.room.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json().catch(() => null);
    const roomId = body?.roomId?.toString().trim();
    const hostKey = body?.hostKey?.toString().trim();
    const totalRounds = Number(body?.totalRounds ?? 5);

    if (!roomId || !hostKey) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const selectedCategory = body?.category?.toString().trim().toLowerCase() || "mix";
    const quizIds = await this.loadQuizIds(totalRounds, selectedCategory);
    if (quizIds.length === 0) {
      return new Response(JSON.stringify({ error: "No persons found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    this.room = {
      id: roomId,
      hostId: null,
      hostKey,
      players: {},
      roundStatus: "lobby",
      selectedCategory,
      currentPerson: null,
      visibleHints: 1,
      guesses: [],
      roundStartTime: null,
      roundDurationSec: 30,
      totalRounds,
      remainingPersonIds: quizIds,
      roundHistory: [],
      revealedName: null,
      hintIntervalSec: 5,
      nextHintAt: null,
      lastHintRevealedAt: null,
      roundEndDelaySec: 4,
      roundCorrectIds: []
    };

    await this.saveState();
    return new Response(JSON.stringify({ roomId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  private async handleState() {
    await this.loadState();
    if (!this.room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    this.checkRoundTimeout();
    await this.saveState();
    return new Response(JSON.stringify(this.toPublic()), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  private handleWebSocket() {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    server.addEventListener("message", (event) => {
      this.onMessage(server, event.data);
    });
    server.addEventListener("close", () => {
      this.onClose(server);
    });
    server.addEventListener("error", () => {
      this.onClose(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private async onMessage(socket: WebSocket, raw: unknown) {
    await this.loadState();
    if (!this.room || typeof raw !== "string") return;

    let parsed: { type?: string; payload?: any } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const type = parsed.type;
    const payload = parsed.payload ?? {};

    if (type === "joinRoom") {
      const name = payload.name?.toString().trim();
      const hostKey = payload.hostKey?.toString();
      const existingPlayerId = payload.playerId?.toString();
      if (!name) return;

      let playerId = existingPlayerId;
      if (playerId && this.room.players[playerId]) {
        this.room.players[playerId].connected = true;
        this.room.players[playerId].name = name;
      } else {
        playerId = createId();
        this.room.players[playerId] = {
          id: playerId,
          name,
          score: 0,
          ready: false,
          connected: true
        };
      }

      if (!this.room.hostId && hostKey && hostKey === this.room.hostKey) {
        this.room.hostId = playerId;
      }

      this.sockets.set(socket, playerId);
      await this.saveState();
      socket.send(JSON.stringify({ type: "joined", payload: { playerId } }));
      this.broadcastRoomUpdate();
      return;
    }

    const playerId = this.sockets.get(socket);
    if (!playerId) return;

    if (type === "leave") {
      this.room.players[playerId].connected = false;
      if (this.room.hostId === playerId) {
        const nextHost = Object.values(this.room.players).find((p) => p.connected);
        this.room.hostId = nextHost?.id ?? null;
      }
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }

    if (type === "toggleReady") {
      const player = this.room.players[playerId];
      player.ready = Boolean(payload.ready);
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }

    if (type === "startGame") {
      if (this.room.hostId !== playerId) return;
      const allReady = Object.values(this.room.players).every((p) => p.ready);
      if (!allReady) return;
      if (this.room.roundStatus === "playing") return;

      if (!this.room.currentPerson) {
        const nextId = this.room.remainingPersonIds.shift() ?? null;
        const nextPerson = await this.loadPersonById(nextId);
        if (!nextPerson) return;
        this.room.currentPerson = nextPerson;
        this.room.roundHistory.push({ id: nextPerson.id, name: nextPerson.name });
      }
      this.room.roundStatus = "playing";
      this.room.visibleHints = 1;
      this.room.guesses = [];
      this.room.roundStartTime = Date.now();
      this.room.revealedName = null;
      this.room.lastHintRevealedAt = null;
      this.room.roundCorrectIds = [];
      await this.saveState();
      this.broadcastRoomUpdate();
      this.scheduleNextHint();
      return;
    }

    if (type === "setCategory") {
      if (this.room.hostId !== playerId) return;
      if (this.room.roundStatus !== "lobby") return;
      const category = payload.category?.toString().trim().toLowerCase();
      if (!category) return;
      this.room.selectedCategory = category;
      const quizIds = await this.loadQuizIds(this.room.totalRounds, category);
      if (quizIds.length > 0) {
        this.room.remainingPersonIds = quizIds;
      }
      this.room.roundHistory = [];
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }

    if (type === "guess") {
      const answer = payload.answer?.toString().trim();
      if (!answer || this.room.roundStatus !== "playing") return;

      const person = this.room.currentPerson;
      if (!person || !this.room.roundStartTime) return;

      const elapsedMs = Date.now() - this.room.roundStartTime;
      const hintIdx = Math.max(0, this.room.visibleHints - 1);
      const maxHints = person.hints.length;
      const hintFactor = 1 - hintIdx / maxHints;
      const timeFactor = 1 - elapsedMs / (this.room.roundDurationSec * 1000);
      const points = Math.max(0, Math.round(100 * hintFactor * timeFactor));

      const correct = answer.toLowerCase() === person.name.toLowerCase();
      const alreadyCorrect = this.room.roundCorrectIds.includes(playerId);
      const guess: Guess = {
        playerId,
        playerName: this.room.players[playerId].name,
        answer,
        correct,
        timeMs: elapsedMs,
        points: correct && !alreadyCorrect ? points : 0
      };

      this.room.guesses.push(guess);
      if (correct && !alreadyCorrect) {
        this.room.players[playerId].score += points;
        this.room.roundCorrectIds.push(playerId);
      }

      const connectedPlayers = Object.values(this.room.players).filter(
        (p) => p.connected
      );
      if (
        connectedPlayers.length > 0 &&
        this.room.roundCorrectIds.length >= connectedPlayers.length
      ) {
        this.room.roundStatus = "roundEnd";
        this.room.revealedName = person.name;
        this.room.nextHintAt = null;
        this.room.lastHintRevealedAt = null;
      }

      await this.saveState();
      this.broadcast({ type: "guessResult", payload: guess });
      this.broadcastRoomUpdate();
      return;
    }

    if (type === "nextRound") {
      if (this.room.hostId !== playerId) return;
      if (this.room.roundStatus !== "roundEnd") return;
      if (this.room.remainingPersonIds.length === 0) return;

      this.checkRoundTimeout();
      const person = this.room.currentPerson;
      this.room.roundStatus = "roundEnd";
      this.room.revealedName = person?.name ?? null;
      this.room.currentPerson = null;

      const nextId = this.room.remainingPersonIds.shift() ?? null;
      const nextPerson = await this.loadPersonById(nextId);
      if (!nextPerson) return;
      this.room.currentPerson = nextPerson;
      this.room.roundHistory.push({ id: nextPerson.id, name: nextPerson.name });
      this.room.roundStatus = "playing";
      this.room.visibleHints = 1;
      this.room.guesses = [];
      this.room.roundStartTime = Date.now();
      this.room.revealedName = null;
      this.room.lastHintRevealedAt = null;
      this.room.roundCorrectIds = [];
      await this.saveState();
      this.broadcastRoomUpdate();
      this.scheduleNextHint();
      return;
    }
    if (type === "resetLobby") {
      if (this.room.hostId !== playerId) return;
      const quizIds = await this.loadQuizIds(
        this.room.totalRounds,
        this.room.selectedCategory
      );
      if (quizIds.length === 0) return;

      this.room.roundStatus = "lobby";
      this.room.currentPerson = null;
      this.room.visibleHints = 1;
      this.room.guesses = [];
      this.room.roundStartTime = null;
      this.room.revealedName = null;
      this.room.nextHintAt = null;
      this.room.lastHintRevealedAt = null;
      this.room.roundCorrectIds = [];
      this.room.remainingPersonIds = quizIds;
      this.room.roundHistory = [];
      Object.values(this.room.players).forEach((player) => {
        player.score = 0;
        player.ready = false;
      });
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }
    if (type === "setConfig") {
      if (this.room.hostId !== playerId) return;
      if (this.room.roundStatus !== "lobby") return;
      const interval = Number(payload.hintIntervalSec);
      const duration = Number(payload.roundDurationSec);
      if (Number.isFinite(interval) && interval >= 2 && interval <= 20) {
        this.room.hintIntervalSec = interval;
      }
      if (Number.isFinite(duration) && duration >= 10 && duration <= 120) {
        this.room.roundDurationSec = duration;
      }
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }
  }

  private async onClose(socket: WebSocket) {
    await this.loadState();
    const playerId = this.sockets.get(socket);
    if (!this.room || !playerId) {
      this.sockets.delete(socket);
      return;
    }

    this.sockets.delete(socket);
    if (this.room.players[playerId]) {
      this.room.players[playerId].connected = false;
      if (this.room.hostId === playerId) {
        const nextHost = Object.values(this.room.players).find((p) => p.connected);
        this.room.hostId = nextHost?.id ?? null;
      }
    }
    await this.saveState();
    this.broadcastRoomUpdate();
  }

  async alarm() {
    await this.loadState();
    if (!this.room) return;

    this.checkRoundTimeout();
    if (this.room.roundStatus !== "playing") {
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }

    const person = this.room.currentPerson;
    if (!person) return;

    if (this.room.lastHintRevealedAt) {
      const elapsed = (Date.now() - this.room.lastHintRevealedAt) / 1000;
      if (elapsed >= this.room.roundEndDelaySec) {
        this.room.roundStatus = "roundEnd";
        this.room.revealedName = person.name;
        this.room.nextHintAt = null;
        await this.saveState();
        this.broadcastRoomUpdate();
        return;
      }
      await this.saveState();
      this.broadcastRoomUpdate();
      return;
    }

    if (this.room.visibleHints < person.hints.length) {
      this.room.visibleHints += 1;
      if (this.room.visibleHints >= person.hints.length) {
        this.room.lastHintRevealedAt = Date.now();
        await this.saveState();
        this.broadcastRoomUpdate();
        this.scheduleRoundEndDelay();
        return;
      }
      await this.saveState();
      this.broadcastRoomUpdate();
      this.scheduleNextHint();
    }
  }
}
