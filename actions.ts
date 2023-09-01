import { Action, SocketState, createAction, createClientAction } from "./clientTypes";

import { Client } from "./reducers";

export type BackendPayloads = {
    "StartServer": null,
    "Connect": { client: Client, state: SocketState },
    "Disconnect": { client: Client, state: SocketState },
    "Queue": { client: Client },
    "Update": { client: Client, state: SocketState },
    "StartGame": { client: Client, state: SocketState, gamemode: "Singleplayer" | "Multiplayer" },
    "NumPlayers": { client: Client, state: SocketState, numPlayers: number },
};

export type BackendActionTypes = keyof BackendPayloads;
export type BackendActions = { [K in BackendActionTypes]: BackendAction<K> }[BackendActionTypes];
export type BackendAction<T extends BackendActionTypes> = Action<T, BackendPayloads[T], "Backend">;

export const createBackendAction = <T extends BackendActionTypes>(type: T, payload: BackendPayloads[T]): BackendAction<T> => createAction(type, payload, "Backend");


// given to local state action reducer
// server -> server actions, also client -> server actions
export const connectAction = (client: Client, state: SocketState) => createBackendAction("Connect", { client, state })
export const disconnectAction = (client: Client, state: SocketState) => createBackendAction("Disconnect", { client, state })
export const backendUpdateAction = (client: Client, state: SocketState) => createBackendAction("Update", { client, state })
export const startGameAction = (client: Client, state: SocketState, gamemode: "Singleplayer" | "Multiplayer") => createBackendAction("StartGame", { client, state, gamemode })
export const startServerAction = () => createBackendAction("StartServer", null)
export const queueUserAction = (client: Client) => createBackendAction("Queue", { client })



// for server -> client actions
export const numPlayersAction = (numPlayers: number) => createClientAction("NumPlayers", { numPlayers })
export const sendMessageAction = (message: string) => createClientAction("SendMessage", { message })

