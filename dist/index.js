"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const utils_1 = require("./utils");
const crypto_1 = require("crypto");
// load env
// require('dotenv').config();
const getWSConfig = () => {
    if (process.env.USE_SSL === "true") {
        console.log("Using SSL");
        const privateKey = fs_1.default.readFileSync(process.env.KEY_DIR, 'utf8');
        const certificate = fs_1.default.readFileSync(process.env.CERT_DIR, 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        const app = (0, express_1.default)();
        //pass in your express app and credentials to create an https server
        const httpsServer = https_1.default.createServer(credentials, app);
        httpsServer.listen(3030);
        return { server: httpsServer };
    }
    console.log("Not using SSL");
    return { port: 3030, host: "0.0.0.0" };
};
// when we get a succesful connection, log it to the console
const wss = new ws_1.default.Server(getWSConfig());
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
// periodic player count update for all clients
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
    updateState((0, actions_1.connectAction)(user, reducers_1.defaultSocketState));
    ws.send(JSON.stringify((0, actions_1.sendMessageAction)("Welcome to the server!")));
    ws.send(JSON.stringify((0, actions_1.numPlayersAction)(gameState.value.clients.length)));
    console.log("New connection: " + user.uid, "Total connections: " + gameState.value.clients.length);
    ws.on('message', interpretMessage(user));
    ws.on("close", function close(client) {
        updateState((0, actions_1.disconnectAction)(user, reducers_1.defaultSocketState));
        console.log("Connection closed: " + user.uid, "Total connections: " + gameState.value.clients.length);
        // clear any sessions that this user was in
    });
});
console.log('Websocket server started on port 3030');
function interpretMessage(user) {
    return function incoming(message) {
        const backendAction = (0, reducers_1.clientActionTransformer)(user)(message.toString());
        if (backendAction)
            updateState(backendAction);
        // check all sessions, if any have events to send out, send them out
        Object.entries(gameState.value.sessions).forEach((entry) => {
            const value = entry[1];
            const { player1, player2, player1Actions, player2Actions, globalActions } = value;
            // send out all actions to the clients
            // we will be filtering through ones that are part of our session though, so not all clients will get all actions
            gameState.value.clients.forEach((client) => {
                const uid = client.uid;
                const connection = client.ws;
                if (((uid === player1.uid) || (player2 && uid === player2.uid)) && (connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN) {
                    globalActions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }
                if (uid === player1.uid && (connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN) {
                    player1Actions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }
                if ((player2) && (uid === player2.uid) && ((connection === null || connection === void 0 ? void 0 : connection.readyState) === ws_1.default.OPEN)) {
                    player2Actions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }
            });
        });
    };
}
