"use strict";
// node websoockets server
// re-broadcast everything it receives back to all clients
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// websocket stuff
// require the websocket module
const ws_1 = __importDefault(require("ws"));
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const utils_1 = require("./utils");
const crypto_1 = require("crypto");
/*

Useful code for deduping?
wss.clients.forEach((client) => {
    if (client === ws && client.readyState === WebSocket.OPEN) {
        // broadcast message to all clients
        ws.send(JSON.stringify({ message: "Yipee" }));
    }
})

*/
// when we get a succesful connection, log it to the console
const wss = new ws_1.default.Server({ port: 3030, host: "0.0.0.0" });
const initialState = {
    clients: [],
    clientStates: {},
    sessions: {},
    leaderboard: [],
};
let gameState = (0, utils_1.lazyState)(initialState);
const updateState = (action) => {
    gameState = gameState.next(action);
};
// intervals, periodic actions
// periodic player count update
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.default.OPEN) {
            client.send(JSON.stringify((0, actions_1.numPlayersAction)(gameState.value.clients.length)));
        }
    });
}, 10000);
// when a new connection is made, send a message to the console
wss.on('connection', function connection(ws) {
    const user = { uid: (0, crypto_1.randomUUID)(), ws };
    updateState((0, actions_1.connectAction)(user, { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false }));
    ws.send(JSON.stringify((0, actions_1.sendMessageAction)("Welcome to the server!")));
    ws.send(JSON.stringify((0, actions_1.numPlayersAction)(gameState.value.clients.length)));
    console.log("New connection: " + user.uid, "Total connections: " + gameState.value.clients.length);
    ws.on('message', function incoming(message) {
        const backendAction = (0, reducers_1.clientActionTransformer)(user)(message.toString());
        if (backendAction)
            updateState(backendAction);
        // console.log("Message: " + message.toString());
        // check all sessions, if any have events to send out, send them out
        Object.entries(gameState.value.sessions).forEach((entry) => {
            const value = entry[1];
            const { player1, player2, player1Actions, player2Actions, globalActions } = value;
            gameState.value.clients.forEach((client) => {
                const uid = client.uid;
                const connection = client.ws;
                if (((uid === player1.uid) || (player2 && uid === player2.uid)) && (connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN) {
                    globalActions.forEach((action) => {
                        console.log("Sending Global", action.type, "to: " + user.uid);
                        connection.send(JSON.stringify(action));
                    });
                }
                if (uid === player1.uid && (connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN) {
                    player1Actions.forEach((action) => {
                        console.log("Sending P1", action.type, "to: " + player1.uid);
                        connection.send(JSON.stringify(action));
                    });
                }
                if ((player2) && (uid === player2.uid) && ((connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN)) {
                    player2Actions.forEach((action) => {
                        console.log("Sending P2", action.type, "to: " + player2.uid);
                        connection.send(JSON.stringify(action));
                    });
                }
            });
        });
        // console.log(gameState.value.sessions)
    });
    ws.on("close", function close(client) {
        updateState((0, actions_1.disconnectAction)(user, { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false }));
        console.log("Connection closed: " + user.uid, "Total connections: " + gameState.value.clients.length);
        // clear any sessions that this user was in
    });
});
console.log('Websocket server started on port 3030');
