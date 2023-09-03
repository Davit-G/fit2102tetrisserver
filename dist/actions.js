"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageAction = exports.numPlayersAction = exports.queueUserAction = exports.startServerAction = exports.startGameAction = exports.backendUpdateAction = exports.disconnectAction = exports.connectAction = void 0;
const clientTypes_1 = require("./clientTypes");
const createBackendAction = (type, payload) => (0, clientTypes_1.createAction)(type, payload, "Backend");
// given to local state action reducer
// server -> server actions, also client -> server actions
const connectAction = (client, state) => createBackendAction("Connect", { client, state });
exports.connectAction = connectAction;
const disconnectAction = (client, state) => createBackendAction("Disconnect", { client, state });
exports.disconnectAction = disconnectAction;
const backendUpdateAction = (client, state) => createBackendAction("Update", { client, state });
exports.backendUpdateAction = backendUpdateAction;
const startGameAction = (client, state, gamemode) => createBackendAction("StartGame", { client, state, gamemode });
exports.startGameAction = startGameAction;
const startServerAction = () => createBackendAction("StartServer", null);
exports.startServerAction = startServerAction;
const queueUserAction = (client) => createBackendAction("Queue", { client });
exports.queueUserAction = queueUserAction;
// for server -> client actions
const numPlayersAction = (numPlayers) => (0, clientTypes_1.createClientAction)("NumPlayers", { numPlayers });
exports.numPlayersAction = numPlayersAction;
const sendMessageAction = (message) => (0, clientTypes_1.createClientAction)("SendMessage", { message });
exports.sendMessageAction = sendMessageAction;
