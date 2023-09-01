import { WebSocket } from "ws";
import {BackendAction, BackendActionTypes, BackendActions, queueUserAction, backendUpdateAction } from "./actions";
import { Block, ClientActions, Piece, ServerAction, ServerActions, State, clientStartGameAction, clientUpdateAction } from "./clientTypes";

export type Client = {
    uid: string,
    ws: WebSocket | null,
}

export type Session = {
    player1: Client,
    player2: Client | null,
    started: boolean, // whether the game started or not
    finished: boolean, // whether the game finished or not
    winner: Client | null, // the winner of the game
    player1State: SocketState,
    player2State: SocketState,
    player1Actions: ClientActions[],
    player2Actions: ClientActions[],
    globalActions: ClientActions[],
}

export type SocketState = Readonly<{
    blocks: ReadonlyArray<Block>, // blocks that have settled
    gameEnd: boolean, // whether the game is finished or not
    domExit: ReadonlyArray<Block>, // the elements that will be removed from the DOM / view
    objCount: number, // the number of objects that have been created, good for creating IDs with
    active: Readonly<Piece> | null, // the active piece that is currently being moved
    score: number, // the score of the game
    level: number, // difficulty level we are on
    paused: boolean, // whether the game is paused or not
}>

export type ServerState = {
    clients: Client[],
    clientStates: { [key: string]: SocketState },
    sessions: { [key: string]: Session },
    leaderboard: ReadonlyArray<{ client: Client, score: number }>,
}

export const defaultSocketState: SocketState = { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false, level: 1 }

const newSession = (player1: Client): Session => ({
    player1,
    player2: null,
    started: false,
    finished: false,
    winner: null,
    player1State: defaultSocketState,
    player2State: defaultSocketState,
    player1Actions: [],
    player2Actions: [],
    globalActions: [],
})

const filterState = (state: State): SocketState => ({
    blocks: state.blocks,
    gameEnd: state.gameEnd,
    domExit: state.domExit,
    objCount: state.objCount,
    active: state.active,
    score: state.score,
    level: state.level,
    paused: state.paused,
})

export const clientActionTransformer = (client: Client) => (message: string): BackendActions | null => {
    const parsedAction = JSON.parse(message.toString()) as ServerActions

    switch (parsedAction.type as BackendActionTypes) {
        case "Queue": {
            return queueUserAction(client);
        };
        case "Update": return backendUpdateAction(client, filterState((parsedAction as ServerAction<"Update">).payload.state as State))
    }
    
    return null
}

export const actionReducer = (inState: ServerState, action: BackendActions): ServerState => {
    const state  = {
        ...inState,
        sessions: Object.entries(inState.sessions).reduce((obj, [key, value]) => {
            // remove all events
            const { player1Actions, player2Actions, globalActions, ...rest } = value;

            return {
                ...obj,
                [key]: {
                    ...rest,
                    player1Actions: [],
                    player2Actions: [],
                    globalActions: [],
                }
            }
        }, {})
    } as ServerState


    switch (action.type) {
        case "Queue": {
            const { payload } = action as BackendAction<"Queue">;

            // console.log("Queueing user: " + payload.client.uid)
            // check for empty sessions first
            const emptySession = Object.entries(state.sessions).find(([key, value]) => value.player2 === null);

            // console.log(state.sessions," IN QUEUE")

            if (emptySession) {
                const key = emptySession[0] as string
                const existingSession = emptySession[1] as Session

                if (existingSession.player1.uid === payload.client.uid) {
                    return state; // don't do anything if the player is already in the session
                }

                return {
                    ...state,
                    sessions: {
                        ...state.sessions,
                        [key]: {
                            ...existingSession,
                            player2: payload.client,
                            started: true,
                            globalActions: [clientStartGameAction("Multiplayer")],
                        }
                    }
                }
            }

            return {
                ...state,
                sessions: {
                    ...state.sessions,
                    [payload.client.uid]: newSession(payload.client),
                }
            }
        }
        case "StartServer": {
            return {
                ...state,
            }
        }
        case "Connect": {
            const { payload } = action as BackendAction<"Connect">;
            return {
                ...state,
                clients: [...state.clients, payload.client],
                clientStates: {
                    ...state.clientStates,
                    [payload.client.toString()]: payload.state,
                }
            }
        }
        case "Disconnect": {
            const { payload } = action as BackendAction<"Disconnect">;
            return {
                ...state,
                clients: state.clients.filter(client => client !== payload.client),
                clientStates: {
                    ...Object.entries(state.clientStates)
                        .filter(([key, value]) => key !== payload.client.toString())
                        .reduce((obj, [key, value]) => ({...obj, [key]: value }), {})
                },
                sessions: {
                    ...Object.entries(state.sessions)
                        .filter(([key, value]) => value.player1 !== payload.client && value.player2 !== payload.client)
                        .reduce((obj, [key, value]) => ({...obj, [key]: value }), {})
                }
            }
        }
        case "Update": {
            const { payload } = action as BackendAction<"Update">;
            const clientState = filterState(payload.state as State)

            const session = Object.values(state.sessions).filter((session: Session) => session.player1 === payload.client || session.player2 === payload.client)[0]

            return {
                ...state,
                clientStates: {
                    ...state.clientStates,
                    [payload.client.uid]: payload.state,
                },
                sessions: {
                    ...state.sessions,
                    ...(session ? {
                        [payload.client.uid]: {
                            ...session,
                            player1State: session.player1.uid === payload.client.uid ? payload.state : session.player1State,
                            player2State: session.player2?.uid === payload.client.uid ? payload.state : session.player2State,
                            player1Actions: session.player2?.uid === payload.client.uid ? session.player1Actions.concat(clientUpdateAction(clientState)) : [],
                            player2Actions: session.player1.uid === payload.client.uid ? session.player2Actions.concat(clientUpdateAction(clientState)) : [],
                            globalActions: []
                        }
                    }: {})
                }
            }
        }
        default: return state
    }
}
