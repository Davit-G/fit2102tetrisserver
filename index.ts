import WebSocket from "ws";
import { connectAction, disconnectAction, numPlayersAction, sendMessageAction, backendUpdateAction, BackendActions } from "./actions";
import { Client, ServerState, clientActionTransformer, Session, defaultSocketState } from "./reducers";
import { lazyState } from "./utils";
import { randomUUID } from "crypto";

// when we get a succesful connection, log it to the console
const wss = new WebSocket.Server({ port: 3030, host: "0.0.0.0" });

const initialState: ServerState = {
    clients: [],
    clientStates: {},
    sessions: {},
    leaderboard: [],
}

let gameState = lazyState(initialState);

const updateState = (action: BackendActions) => {
    gameState = gameState.next(action);
}

// periodic player count update for all clients
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(numPlayersAction(gameState.value.clients.length)));
        }
    })
}, 10000)

// when a new connection is made, send a message to the console
wss.on('connection', function connection(ws: WebSocket) {
    const user: Client = { uid: randomUUID(), ws }

    updateState(connectAction(user, defaultSocketState));
    
    ws.send(JSON.stringify(sendMessageAction("Welcome to the server!")));
    ws.send(JSON.stringify(numPlayersAction(gameState.value.clients.length)));
    
    console.log("New connection: " + user.uid, "Total connections: " + gameState.value.clients.length);

    ws.on('message', interpretMessage(user));

    ws.on("close", function close(client) {
        updateState(disconnectAction(user, defaultSocketState));
        console.log("Connection closed: " + user.uid, "Total connections: " + gameState.value.clients.length);

        // clear any sessions that this user was in
    })
});

console.log('Websocket server started on port 3030');

function interpretMessage(user: Client): (this: WebSocket, data: WebSocket.RawData, isBinary: boolean) => void {
    return function incoming(message) {
        const backendAction = clientActionTransformer(user)(message.toString());
        if (backendAction) updateState(backendAction);


        // check all sessions, if any have events to send out, send them out
        Object.entries(gameState.value.sessions).forEach((entry) => {
            const value = entry[1];
            const { player1, player2, player1Actions, player2Actions, globalActions } = value as Session;

            // send out all actions to the clients
            // we will be filtering through ones that are part of our session though, so not all clients will get all actions
            gameState.value.clients.forEach((client) => {
                const uid = client.uid;
                const connection = client.ws;

                if (((uid === player1.uid) || (player2 && uid === player2.uid)) && connection?.readyState === WebSocket.OPEN) {
                    globalActions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }

                if (uid === player1.uid && connection?.readyState === WebSocket.OPEN) {
                    player1Actions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }

                if ((player2) && (uid === player2.uid) && (connection?.readyState === WebSocket.OPEN)) {
                    player2Actions.forEach((action) => {
                        connection.send(JSON.stringify(action));
                    });
                }
            });
        });
    };
}
