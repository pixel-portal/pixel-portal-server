import Server from "./core/server/server";
import StarportServerClient from "./core/server/starport-server-client";
import PlayerManager from "./player/player-manager";
import GameState from "./state/game-state";
import WorkerEventPublisher from "./worker/worker-event-publisher";
import { WorkerMessageType } from "./worker/worker-message";
import { GAME_BUFFER_SIZE, SNAPSHOT_BUFFER_SIZE, WORKER_BUFFER_SIZE } from "./worker/worker-state";
import { loadParameters } from "./core/configuration/parameters";
import ServerConfiguration from "./core/configuration/server-configuration";


const PING_INTERVAL = 60000;

const parameters = loadParameters();
if (!parameters?.configuration) {
  throw "Must provide --configuration parameter";
}

const configuration = await ServerConfiguration.load(!!parameters.dev, parameters.configuration);

const workerBuffer = new SharedArrayBuffer(WORKER_BUFFER_SIZE);
const gameBuffer = new SharedArrayBuffer(GAME_BUFFER_SIZE);
const snapshotBuffer = new SharedArrayBuffer(SNAPSHOT_BUFFER_SIZE);
const sharedState = {
  workerView: new DataView(workerBuffer),
  worker: new Uint8Array(workerBuffer).fill(0),

  gameView: new DataView(gameBuffer),
  game: new Uint8Array(gameBuffer).fill(0),

  snapshotView: new DataView(snapshotBuffer),
  snapshot: new Uint8Array(snapshotBuffer).fill(0),
};

const gameState = new GameState();
const state = {
  stopped: false,
};

const playerManager = new PlayerManager(gameState);
const starportServerClient = new StarportServerClient(configuration, gameState, playerManager);

const workerPublisher = new WorkerEventPublisher(sharedState);
const server = Server.create(configuration, playerManager, workerPublisher);

const worker = new Worker("./src/worker/worker.ts");
worker.onmessage = event => {
  if (event.data.t === WorkerMessageType.SNAPSHOT_PACKET_UPDATE) {
    server.packetServer.updateChannels(Buffer.from(snapshotBuffer, 0, event.data.s));
  }
  else if (event.data.t === WorkerMessageType.GAME_PACKET_UPDATE) {
    server.packetServer.updateChannels(Buffer.from(gameBuffer, 0, event.data.s));
    starportServerClient.ping();
  }
  else if (event.data.t === WorkerMessageType.INITIALIZE_GAME) {
    gameState.mapId = event.data.m;
    gameState.gameStart = event.data.gs;
    gameState.gameEnd = event.data.ge;
    gameState.gameShutdown = event.data.gh;
    starportServerClient.ping()
  }
  else if (event.data.t === WorkerMessageType.RESET_GAME) {
    server.packetServer.disconnectAll();
    playerManager.clear();
    gameState.reset();
    starportServerClient.ping()
  }
};
worker.postMessage({
  t: WorkerMessageType.INITIALIZE_ENGINE,
  wb: workerBuffer,
  gb: gameBuffer,
  sb: snapshotBuffer,
});

setInterval(() => starportServerClient.ping(), PING_INTERVAL);
starportServerClient.ping();

function stop () {
  if (!state.stopped) {
    state.stopped = true;
    server.stop();
    workerPublisher.stop();
    worker.terminate();
  }

  process.exit(0);
}

process.on("SIGINT", stop);
process.on("exit", stop);
