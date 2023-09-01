import { WebSocket } from "ws";
import {BackendAction, BackendActionTypes, BackendActions, queueUserAction, updateAction } from "./actions";
import { ClientActions, SocketState, State, startGameAction } from "./clientTypes";

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

export type ServerState = {
    clients: Client[],
    clientStates: { [key: string]: SocketState },
    sessions: { [key: string]: Session },
    leaderboard: ReadonlyArray<{ client: Client, score: number }>,
}

const newSession = (player1: Client): Session => ({
    player1,
    player2: null,
    started: false,
    finished: false,
    winner: null,
    player1State: { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false },
    player2State: { blocks: [], gameEnd: false, domExit: [], objCount: 0, active: null, score: 0, paused: false },
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
    paused: state.paused,
})

export const clientActionTransformer = (client: Client) => (message: string): BackendActions => {
    const parsedAction = JSON.parse(message.toString())[0] as BackendActions

    // console.log(Object.keys(parsedAction.payload.data.state))

    switch (parsedAction.type as BackendActionTypes) {
        case "Queue": {
            return queueUserAction(client, (parsedAction as BackendAction<"Queue">).payload.state)
        }
        default: return updateAction(client, filterState((parsedAction as BackendAction<"Update">).payload.state as State))
    }
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
                            globalActions: [sendStartGameAction()],
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
            const { payload } = action as Connect;
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
            const { payload } = action as Disconnect;
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
            const { payload } = action as Update;
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
                            player1Actions: session.player2?.uid === payload.client.uid ? session.player1Actions.concat(serverUpdateAction(payload.state)) : [],
                            player2Actions: session.player1.uid === payload.client.uid ? session.player2Actions.concat(serverUpdateAction(payload.state)) : [],
                            globalActions: []
                        }
                    }: {})
                }
            }
        }
        default: return state
    }
}
