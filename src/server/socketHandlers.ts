import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { Lobby, Player, GameMode, ContentMode } from '../types';
import {
  generateLobbyCode,
  generateSyncCode,
  sanitizeNickname,
  isForbiddenNickname,
} from '../lib/gameUtils';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  RATE_LIMIT_MAX_EVENTS,
  RATE_LIMIT_WINDOW_MS,
} from '../lib/constants';
import { updatePlayerXP, updateLeaderboard } from './db';
import { runCoByRadej } from './games/coByRadej';
import { runPodvodnik } from './games/podvodnik';
import { runKtoByNajskor } from './games/ktoByNajskor';
import { runMestoStatRieka } from './games/mestoStatRieka';
import { getGame } from './games/gameManager';

// In-memory state (faster than DB for realtime)
const lobbies = new Map<string, Lobby>();
const socketToPlayer = new Map<string, { playerId: string; lobbyCode: string }>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const activeGameRunners = new Map<string, any>(); // gameId or lobbyCode -> runner instance
const nextGameVotes = new Map<string, Record<string, GameMode>>(); // lobbyCode -> playerId -> GameMode

// Rate limiter
function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(socketId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(socketId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_EVENTS) {
    return false;
  }

  limit.count++;
  return true;
}

// Get lobby by player socket ID
function getLobbyBySocket(socketId: string): Lobby | null {
  const info = socketToPlayer.get(socketId);
  if (!info) return null;
  return lobbies.get(info.lobbyCode) || null;
}

// Get player in lobby
function getPlayerInLobby(lobby: Lobby, playerId: string): Player | null {
  return lobby.players.find((p) => p.id === playerId) || null;
}

// Broadcast lobby update to all players in room
function broadcastLobbyUpdate(io: Server, lobby: Lobby) {
  io.to(lobby.code).emit('lobby_updated', { lobby });
  io.to(`lobby:${lobby.code}`).emit('lobby_updated', { lobby });
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ===== CREATE LOBBY =====
    socket.on('create_lobby', (data: { nickname: string; emoji: string; contentMode?: ContentMode }) => {
      if (!checkRateLimit(socket.id)) {
        socket.emit('error', { message: 'Príliš veľa akcií. Počkaj chvíľu.', code: 'RATE_LIMITED' });
        return;
      }

      try {
        const nickname = sanitizeNickname(data.nickname || '');
        if (nickname.length < 2 || nickname.length > 20) {
          socket.emit('error', { message: 'Neplatná prezývka (2-20 znakov)', code: 'INVALID_NICKNAME' });
          return;
        }
        if (isForbiddenNickname(nickname)) {
          socket.emit('error', { message: 'Táto prezývka nie je povolená', code: 'FORBIDDEN_NICKNAME' });
          return;
        }

        // Generate unique 5-char lobby code
        let code: string;
        let attempts = 0;
        do {
          code = generateLobbyCode();
          attempts++;
        } while (lobbies.has(code) && attempts < 100);

        if (lobbies.has(code)) {
          socket.emit('error', { message: 'Nepodarilo sa vytvoriť lobby', code: 'LOBBY_CREATE_FAILED' });
          return;
        }

        const player: Player = {
          id: uuidv4(),
          nickname,
          emoji: data.emoji || '🎮',
          score: 0,
          xp: 0,
          level: 0,
          isHost: true,
          isConnected: true,
          socketId: socket.id,
          syncCode: generateSyncCode(),
        };

        const lobby: Lobby = {
          code,
          hostId: player.id,
          players: [player],
          maxPlayers: MAX_PLAYERS,
          contentMode: data.contentMode || 'mix',
          status: 'waiting',
          createdAt: Date.now(),
        };

        lobbies.set(code, lobby);
        socketToPlayer.set(socket.id, { playerId: player.id, lobbyCode: code });

        socket.join(code);
        socket.join(`lobby:${code}`);
        socket.emit('lobby_created', { lobby, player });

        console.log(`[Lobby] Created ${code} by ${nickname}`);
      } catch (err) {
        console.error('[create_lobby error]', err);
        socket.emit('error', { message: 'Nastala chyba pri vytváraní lobby', code: 'INTERNAL_ERROR' });
      }
    });

    // ===== JOIN LOBBY =====
    socket.on('join_lobby', (data: { code: string; nickname: string; emoji: string }) => {
      if (!checkRateLimit(socket.id)) {
        socket.emit('error', { message: 'Príliš veľa akcií. Počkaj chvíľu.', code: 'RATE_LIMITED' });
        return;
      }

      try {
        const code = (data.code || '').trim().toUpperCase();
        const lobby = lobbies.get(code);

        if (!lobby) {
          socket.emit('error', { message: 'Lobby s týmto kódom neexistuje', code: 'LOBBY_NOT_FOUND' });
          return;
        }

        if (lobby.players.length >= lobby.maxPlayers) {
          socket.emit('error', { message: 'Lobby je plné (max 12 hráčov)', code: 'LOBBY_FULL' });
          return;
        }

        const nickname = sanitizeNickname(data.nickname || '');
        if (nickname.length < 2) {
          socket.emit('error', { message: 'Neplatná prezývka (min 2 znaky)', code: 'INVALID_NICKNAME' });
          return;
        }
        if (isForbiddenNickname(nickname)) {
          socket.emit('error', { message: 'Táto prezývka nie je povolená', code: 'FORBIDDEN_NICKNAME' });
          return;
        }

        // Check nickname uniqueness in lobby
        const nickTaken = lobby.players.some(
          (p) => p.nickname.toLowerCase() === nickname.toLowerCase() && p.isConnected
        );
        if (nickTaken) {
          socket.emit('error', { message: 'Táto prezývka je už v lobby obsadená', code: 'NICKNAME_TAKEN' });
          return;
        }

        const player: Player = {
          id: uuidv4(),
          nickname,
          emoji: data.emoji || '🎮',
          score: 0,
          xp: 0,
          level: 0,
          isHost: false,
          isConnected: true,
          socketId: socket.id,
          syncCode: generateSyncCode(),
        };

        lobby.players.push(player);
        socketToPlayer.set(socket.id, { playerId: player.id, lobbyCode: code });

        socket.join(code);
        socket.join(`lobby:${code}`);
        socket.emit('lobby_created', { lobby, player });
        io.to(code).emit('player_joined', { player, lobby });
        io.to(`lobby:${code}`).emit('player_joined', { player, lobby });
        broadcastLobbyUpdate(io, lobby);

        console.log(`[Lobby] ${nickname} joined ${code}`);
      } catch (err) {
        console.error('[join_lobby error]', err);
        socket.emit('error', { message: 'Nastala chyba pri pripájaní', code: 'INTERNAL_ERROR' });
      }
    });

    // ===== GET LOBBY STATE =====
    socket.on('get_lobby', (data: { code: string }) => {
      const code = (data.code || '').trim().toUpperCase();
      const lobby = lobbies.get(code);
      if (lobby) {
        socket.join(code);
        socket.join(`lobby:${code}`);
        socket.emit('lobby_state', { lobby });
      } else {
        socket.emit('error', { message: 'Lobby neexistuje', code: 'LOBBY_NOT_FOUND' });
      }
    });

    // ===== LEAVE LOBBY =====
    socket.on('leave_lobby', () => {
      handlePlayerLeave(io, socket);
    });

    // ===== KICK PLAYER =====
    socket.on('kick_player', (data: { targetId: string }) => {
      if (!checkRateLimit(socket.id)) return;

      const info = socketToPlayer.get(socket.id);
      if (!info) return;
      const lobby = lobbies.get(info.lobbyCode);
      if (!lobby) return;

      const requester = getPlayerInLobby(lobby, info.playerId);
      if (!requester?.isHost) {
        socket.emit('error', { message: 'Len hostiteľ môže vyhadzovať hráčov', code: 'NOT_HOST' });
        return;
      }

      const targetPlayer = getPlayerInLobby(lobby, data.targetId);
      if (!targetPlayer) return;

      lobby.players = lobby.players.filter((p) => p.id !== data.targetId);

      const targetSocket = io.sockets.sockets.get(targetPlayer.socketId);
      if (targetSocket) {
        targetSocket.emit('player_kicked', { playerId: data.targetId });
        targetSocket.leave(lobby.code);
        targetSocket.leave(`lobby:${lobby.code}`);
        socketToPlayer.delete(targetPlayer.socketId);
      }

      io.to(lobby.code).emit('player_left', { playerId: data.targetId, lobby });
      io.to(`lobby:${lobby.code}`).emit('player_left', { playerId: data.targetId, lobby });
      broadcastLobbyUpdate(io, lobby);
      console.log(`[Lobby] ${targetPlayer.nickname} kicked from ${lobby.code}`);
    });

    // ===== SELECT GAME =====
    socket.on('select_game', (data: { gameMode: GameMode }) => {
      if (!checkRateLimit(socket.id)) return;

      const info = socketToPlayer.get(socket.id);
      if (!info) return;
      const lobby = lobbies.get(info.lobbyCode);
      if (!lobby) return;

      const player = getPlayerInLobby(lobby, info.playerId);
      if (!player?.isHost) {
        socket.emit('error', { message: 'Len hostiteľ môže vybrať hru', code: 'NOT_HOST' });
        return;
      }

      lobby.gameMode = data.gameMode;
      io.to(lobby.code).emit('game_selected', { gameMode: data.gameMode });
      io.to(`lobby:${lobby.code}`).emit('game_selected', { gameMode: data.gameMode });
      broadcastLobbyUpdate(io, lobby);
    });

    // ===== UPDATE CONTENT MODE =====
    socket.on('set_content_mode', (data: { contentMode: ContentMode }) => {
      const info = socketToPlayer.get(socket.id);
      if (!info) return;
      const lobby = lobbies.get(info.lobbyCode);
      if (!lobby) return;
      const player = getPlayerInLobby(lobby, info.playerId);
      if (!player?.isHost) return;

      lobby.contentMode = data.contentMode || 'mix';
      broadcastLobbyUpdate(io, lobby);
    });

    // ===== START GAME =====
    socket.on('start_game', (data: { totalRounds?: number; rounds?: number }) => {
      if (!checkRateLimit(socket.id)) return;

      const info = socketToPlayer.get(socket.id);
      if (!info) return;
      const lobby = lobbies.get(info.lobbyCode);
      if (!lobby) return;

      const player = getPlayerInLobby(lobby, info.playerId);
      if (!player?.isHost) {
        socket.emit('error', { message: 'Len hostiteľ môže spustiť hru', code: 'NOT_HOST' });
        return;
      }

      if (!lobby.gameMode) {
        socket.emit('error', { message: 'Vyber hru pred spustením', code: 'NO_GAME_SELECTED' });
        return;
      }

      const minPlayers = MIN_PLAYERS[lobby.gameMode] || 2;
      const connectedPlayers = lobby.players.filter((p) => p.isConnected);
      if (connectedPlayers.length < minPlayers) {
        socket.emit('error', {
          message: `Pre túto hru potrebuješ aspoň ${minPlayers} hráčov`,
          code: 'NOT_ENOUGH_PLAYERS',
        });
        return;
      }

      const rounds = data.totalRounds || data.rounds || (lobby.gameMode === 'kto-by-najskor' ? 10 : 3);
      lobby.status = 'playing';

      let runner: any = null;
      if (lobby.gameMode === 'co-by-radej') {
        runner = runCoByRadej(io, lobby.code, lobby.players, lobby.contentMode, rounds);
      } else if (lobby.gameMode === 'podvodnik') {
        runner = runPodvodnik(io, lobby.code, lobby.players, lobby.contentMode);
      } else if (lobby.gameMode === 'kto-by-najskor') {
        runner = runKtoByNajskor(io, lobby.code, lobby.players, lobby.contentMode, rounds);
      } else if (lobby.gameMode === 'mesto-stat-rieka') {
        runner = runMestoStatRieka(io, lobby.code, lobby.players, lobby.contentMode, rounds);
      }

      if (runner) {
        activeGameRunners.set(runner.gameId, runner);
        activeGameRunners.set(lobby.code, runner);
        io.to(lobby.code).emit('game_started', { gameId: runner.gameId, gameMode: lobby.gameMode, rounds });
        io.to(`lobby:${lobby.code}`).emit('game_started', { gameId: runner.gameId, gameMode: lobby.gameMode, rounds });
      }

      broadcastLobbyUpdate(io, lobby);
      console.log(`[Game] Started: ${runner?.gameId} in ${lobby.code} mode=${lobby.gameMode}`);
    });

    // ===== GAME ACTIONS: CAST VOTE (co-by-radej & kto-by-najskor) =====
    socket.on('cast_vote', (data: any) => {
      const runner = activeGameRunners.get(data.gameId) || (data.lobbyCode && activeGameRunners.get(data.lobbyCode));
      if (!runner) return;

      if (typeof runner.handleVote === 'function') {
        runner.handleVote(socket, data);
      } else if (typeof runner.onCastVote === 'function') {
        runner.onCastVote(socket, data);
      }
    });

    // ===== GAME ACTIONS: PODVODNIK =====
    socket.on('submit_hint', (data: { gameId: string; hint: string }) => {
      const runner = activeGameRunners.get(data.gameId);
      if (runner && typeof runner.handleHint === 'function') {
        runner.handleHint(socket, data);
      }
    });

    socket.on('vote_spy', (data: { gameId: string; targetId: string }) => {
      const runner = activeGameRunners.get(data.gameId);
      if (runner && typeof runner.handleVote === 'function') {
        runner.handleVote(socket, data);
      }
    });

    socket.on('guess_word', (data: { gameId: string; guess: string }) => {
      const runner = activeGameRunners.get(data.gameId);
      if (runner && typeof runner.handleSpyGuess === 'function') {
        runner.handleSpyGuess(socket, data);
      }
    });

    // ===== GAME ACTIONS: MESTO-ŠTÁT-RIEKA =====
    socket.on('submit_answers', (data: { gameId: string; answers: Record<string, string>; finishedEarly?: boolean }) => {
      const runner = activeGameRunners.get(data.gameId);
      if (runner && typeof runner.onSubmitAnswers === 'function') {
        runner.onSubmitAnswers(socket, data);
      }
    });

    // ===== NEXT GAME VOTING =====
    socket.on('vote_next_game', (data: { gameMode: GameMode }) => {
      const info = socketToPlayer.get(socket.id);
      if (!info) return;

      if (!nextGameVotes.has(info.lobbyCode)) {
        nextGameVotes.set(info.lobbyCode, {});
      }
      const lobbyVotes = nextGameVotes.get(info.lobbyCode)!;
      lobbyVotes[info.playerId] = data.gameMode;

      // Tally votes
      const tally: Record<string, number> = {};
      Object.values(lobbyVotes).forEach((mode) => {
        tally[mode] = (tally[mode] || 0) + 1;
      });

      io.to(info.lobbyCode).emit('next_game_vote_update', { votes: lobbyVotes, tally });
      io.to(`lobby:${info.lobbyCode}`).emit('next_game_vote_update', { votes: lobbyVotes, tally });
    });

    // ===== RETURN TO LOBBY =====
    socket.on('return_to_lobby', () => {
      const info = socketToPlayer.get(socket.id);
      if (!info) return;
      const lobby = lobbies.get(info.lobbyCode);
      if (!lobby) return;

      const player = getPlayerInLobby(lobby, info.playerId);
      if (player?.isHost) {
        lobby.status = 'waiting';
        nextGameVotes.delete(lobby.code);
        broadcastLobbyUpdate(io, lobby);
        io.to(lobby.code).emit('returned_to_lobby', { lobby });
        io.to(`lobby:${lobby.code}`).emit('returned_to_lobby', { lobby });
      }
    });

    // ===== RECONNECT PLAYER =====
    socket.on('reconnect_player', (data: { lobbyCode: string; syncCode: string }) => {
      const lobby = lobbies.get(data.lobbyCode?.toUpperCase());
      if (!lobby) {
        socket.emit('error', { message: 'Lobby neexistuje', code: 'LOBBY_NOT_FOUND' });
        return;
      }

      const player = lobby.players.find((p) => p.syncCode === data.syncCode);
      if (!player) {
        socket.emit('error', { message: 'Neplatný sync kód', code: 'INVALID_SYNC_CODE' });
        return;
      }

      socketToPlayer.delete(player.socketId);
      player.socketId = socket.id;
      player.isConnected = true;
      socketToPlayer.set(socket.id, { playerId: player.id, lobbyCode: lobby.code });

      socket.join(lobby.code);
      socket.join(`lobby:${lobby.code}`);
      socket.emit('lobby_created', { lobby, player });
      broadcastLobbyUpdate(io, lobby);

      console.log(`[Lobby] ${player.nickname} reconnected to ${lobby.code}`);
    });

    // ===== DISCONNECT =====
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      handlePlayerLeave(io, socket);
    });
  });

  // Cleanup stale lobbies every 30 minutes
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 4 * 60 * 60 * 1000; // 4 hours
    for (const [code, lobby] of Array.from(lobbies.entries())) {
      if (now - lobby.createdAt > staleThreshold) {
        lobbies.delete(code);
        activeGameRunners.delete(code);
        nextGameVotes.delete(code);
        console.log(`[Cleanup] Removed stale lobby: ${code}`);
      }
    }
  }, 30 * 60 * 1000);
}

function handlePlayerLeave(io: Server, socket: Socket) {
  const info = socketToPlayer.get(socket.id);
  if (!info) return;

  const lobby = lobbies.get(info.lobbyCode);
  if (!lobby) {
    socketToPlayer.delete(socket.id);
    return;
  }

  const player = getPlayerInLobby(lobby, info.playerId);
  if (!player) {
    socketToPlayer.delete(socket.id);
    return;
  }

  if (lobby.status === 'playing') {
    player.isConnected = false;
    socketToPlayer.delete(socket.id);
    io.to(lobby.code).emit('player_left', { playerId: player.id, lobby });
    io.to(`lobby:${lobby.code}`).emit('player_left', { playerId: player.id, lobby });
    return;
  }

  lobby.players = lobby.players.filter((p) => p.id !== info.playerId);
  socketToPlayer.delete(socket.id);
  socket.leave(lobby.code);
  socket.leave(`lobby:${lobby.code}`);

  if (lobby.players.length === 0) {
    lobbies.delete(lobby.code);
    activeGameRunners.delete(lobby.code);
    nextGameVotes.delete(lobby.code);
    console.log(`[Lobby] Deleted empty lobby: ${lobby.code}`);
    return;
  }

  // Transfer host if needed
  if (player.isHost && lobby.players.length > 0) {
    const connectedPlayers = lobby.players.filter((p) => p.isConnected);
    const newHost = connectedPlayers[0] || lobby.players[0];
    newHost.isHost = true;
    lobby.hostId = newHost.id;
    io.to(lobby.code).emit('host_transferred', { newHostId: newHost.id });
    io.to(`lobby:${lobby.code}`).emit('host_transferred', { newHostId: newHost.id });
  }

  io.to(lobby.code).emit('player_left', { playerId: player.id, lobby });
  io.to(`lobby:${lobby.code}`).emit('player_left', { playerId: player.id, lobby });
  broadcastLobbyUpdate(io, lobby);
  console.log(`[Lobby] ${player.nickname} left ${lobby.code}`);
}
