"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageAction = exports.numPlayersAction = exports.queueUserAction = exports.startServerAction = exports.startGameAction = exports.updateAction = exports.disconnectAction = exports.connectAction = exports.createBackendAction = void 0;
const clientTypes_1 = require("./clientTypes");
const createBackendAction = (type, payload) => (0, clientTypes_1.createAction)(type, payload, "Backend");
exports.createBackendAction = createBackendAction;
// given to local state action reducer
// server -> server actions, also client -> server actions
const connectAction = (client, state) => (0, exports.createBackendAction)("Connect", { client, state });
exports.connectAction = connectAction;
const disconnectAction = (client, state) => (0, exports.createBackendAction)("Disconnect", { client, state });
exports.disconnectAction = disconnectAction;
const updateAction = (client, state) => (0, exports.createBackendAction)("Update", { client, state });
exports.updateAction = updateAction;
const startGameAction = (client, state, gamemode) => (0, exports.createBackendAction)("StartGame", { client, state, gamemode });
exports.startGameAction = startGameAction;
const startServerAction = () => (0, exports.createBackendAction)("StartServer", null);
exports.startServerAction = startServerAction;
const queueUserAction = (client, state) => (0, exports.createBackendAction)("Queue", { client, state });
exports.queueUserAction = queueUserAction;
// for server -> client actions
const numPlayersAction = (numPlayers) => (0, clientTypes_1.createClientAction)("NumPlayers", { numPlayers });
exports.numPlayersAction = numPlayersAction;
const sendMessageAction = (message) => (0, clientTypes_1.createClientAction)("SendMessage", { message });
exports.sendMessageAction = sendMessageAction;
