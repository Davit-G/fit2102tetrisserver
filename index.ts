// node websoockets server
// re-broadcast everything it receives back to all clients

// websocket stuff
// require the websocket module
import WebSocket from "ws";
import { Action, SocketState, State } from "./clientTypes";
import { ServerAction, ServerActions, connectAction, disconnectAction, numPlayersAction, sendMessageAction, updateAction } from "./actions";
import { Client, ServerState, actionReducer, clientActionTransformer, Session } from "./reducers";
import { lazyState } from "./utils";
import { randomUUID } from "crypto";

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
const wss = new WebSocket.Server({ port: 3030, host: "0.0.0.0" });

const initialState: ServerState = {
    clients: [],
    clientStates: {},
    sessions: {},
    leaderboard: [],
}

let gameState = lazyState(initialState);

const updateState = (action: ServerActions) => {
    gameState = gameState.next(action);
}


// intervals, periodic actions

// periodic player count update
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

    updateState(connectAction(user, { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false }));
    
    ws.send(JSON.stringify(sendMessageAction("Welcome to the server!")));
    ws.send(JSON.stringify(numPlayersAction(gameState.value.clients.length)));
    
    console.log("New connection: " + user.uid, "Total connections: " + gameState.value.clients.length);

    ws.on('message', function incoming(message) {
        updateState(clientActionTransformer(user)(message.toString()))

        // console.log("Message: " + message.toString());
        
        // check all sessions, if any have events to send out, send them out
        Object.entries(gameState.value.sessions).forEach((entry) => {
            const value = entry[1];
            const { player1, player2, player1Actions, player2Actions, globalActions } = value as Session

            
            gameState.value.clients.forEach((client) => {
                const uid = client.uid
                const connection = client.ws;
                
                if (((uid === player1.uid) || (player2 && uid === player2.uid)) && connection?.readyState === WebSocket.OPEN) {
                    globalActions.forEach((action) => {
                        console.log("Sending Global", action.type, "to: " + user.uid)
                        connection.send(JSON.stringify(action));
                    })
                }

                if (uid === player1.uid && connection?.readyState === WebSocket.OPEN) {
                    player1Actions.forEach((action) => {
                        console.log("Sending P1", action.type, "to: " + player1.uid)
                        connection.send(JSON.stringify(action));
                    })
                }

                if ((player2) && (uid === player2.uid) && (connection?.readyState === WebSocket.OPEN)) {
                    player2Actions.forEach((action) => {
                        console.log("Sending P2", action.type, "to: " + player2.uid)
                        connection.send(JSON.stringify(action));
                    })
                }
            })
        })

        // console.log(gameState.value.sessions)
    });

    ws.on("close", function close(client) {
        updateState(disconnectAction(user, { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false }));
        console.log("Connection closed: " + user.uid, "Total connections: " + gameState.value.clients.length);

        // clear any sessions that this user was in
    })
});

console.log('Websocket server started on port 3030');