import { mockPersons } from "../data/mockPersons";
import type { Person } from "../types/person";

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

type RoomState = {
  id: string;
  hostId: string | null;
  hostKey: string;
  players: Record<string, Player>;
  roundStatus: RoundStatus;
  currentPersonId: string | null;
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

const shuffle = <T>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getPersonById = (id: string | null) => {
  if (!id) return null;
  return mockPersons.find((person) => person.id === id) ?? null;
};

export class RoomDurableObject {
  private state: DurableObjectState;
  private room: RoomState | null = null;
  private sockets = new Map<WebSocket, string>();

  constructor(state: DurableObjectState) {
    this.state = state;
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

  private toPublic(): RoomPublic {
    const room = this.room as RoomState;
    const person = getPersonById(room.currentPersonId);
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

    const person = getPersonById(this.room.currentPersonId);
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

    const quizIds = shuffle(mockPersons)
      .filter((person) => person.category === "Testowa")
      .slice(0, totalRounds)
      .map((person) => person.id);

    this.room = {
      id: roomId,
      hostId: null,
      hostKey,
      players: {},
      roundStatus: "lobby",
      currentPersonId: null,
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

      if (!this.room.currentPersonId) {
        this.room.currentPersonId = this.room.remainingPersonIds.shift() ?? null;
      }
      const startPerson = getPersonById(this.room.currentPersonId);
      if (startPerson) {
        this.room.roundHistory.push({ id: startPerson.id, name: startPerson.name });
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

    if (type === "guess") {
      const answer = payload.answer?.toString().trim();
      if (!answer || this.room.roundStatus !== "playing") return;

      const person = getPersonById(this.room.currentPersonId);
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
      const person = getPersonById(this.room.currentPersonId);
      this.room.roundStatus = "roundEnd";
      this.room.revealedName = person?.name ?? null;
      this.room.currentPersonId = null;

      this.room.currentPersonId = this.room.remainingPersonIds.shift() ?? null;
      const nextPerson = getPersonById(this.room.currentPersonId);
      if (nextPerson) {
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
    if (type === "resetLobby") {
      if (this.room.hostId !== playerId) return;
      const quizIds = shuffle(mockPersons)
        .filter((person) => person.category === "Testowa")
        .slice(0, this.room.totalRounds)
        .map((person) => person.id);

      this.room.roundStatus = "lobby";
      this.room.currentPersonId = null;
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

    const person = getPersonById(this.room.currentPersonId);
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
