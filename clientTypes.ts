import { SocketState } from "./reducers";

export type SourceTypes = "State" | "Client" | "Server" | "Backend"

export type Action<G, T, S extends SourceTypes> = {
    type: G,
    payload: T,
    destination: S,
}

// different types of actions
export type StateAction<T extends StateActionTypes> = Action<T, StatePayloads[T], "State">;
export type ClientAction<T extends ClientActionTypes> = Action<T, ClientPayloads[T], "Client">;
export type ServerAction<T extends ServerActionTypes> = Action<T, ServerPayloads[T], "Server">;

// Utility function for creating actions
export const createAction = <T, P, S extends SourceTypes>(type: T, payload: P, destination: S): Action<T, P, S> => ({ type, payload, destination });
export const createStateAction = <T extends StateActionTypes>(type: T, payload: StatePayloads[T]): StateAction<T> => createAction(type, payload, "State");
export const createClientAction = <T extends ClientActionTypes>(type: T, payload: ClientPayloads[T]): ClientAction<T> => createAction(type, payload, "Client");
export const createServerAction = <T extends ServerActionTypes>(type: T, payload: ServerPayloads[T]): ServerAction<T> => createAction(type, payload, "Server");

// ======
// Internal State Actions
// ======

export type StatePayloads = {
    Rotate: { rotationDirection: 1 | -1 },
    Move: { direction: 1 | -1 | null },
    Drop: null,
    ResetGame: null,
    Tick: { elapsed: number },
    Fall: null,
    Hold: null,
    Pause: null,
    StartGame: "Singleplayer" | "Multiplayer",
};

export type StateActionTypes = keyof StatePayloads;
export type StateActions = { [K in StateActionTypes]: StateAction<K> }[StateActionTypes];

// Create actions using the utility function
export const rotateAction = (rotationDirection: 1 | -1) => createStateAction('Rotate', { rotationDirection });
export const moveAction = (direction: 1 | -1 | null) => createStateAction('Move', { direction });
export const dropAction = () => createStateAction('Drop', null);
export const resetGameAction = () => createStateAction('ResetGame', null);
export const tickAction = (elapsed: number) => createStateAction('Tick', { elapsed });
export const fallAction = () => createStateAction('Fall', null);
export const holdAction = () => createStateAction('Hold', null);
export const pauseAction = () => createStateAction('Pause', null);
export const startGameAction = (gamemode: "Singleplayer" | "Multiplayer") => createStateAction('StartGame', gamemode);

// ======
// Client Actions
// ======

// stuff that the client will be receiving from the multiplayer server
// server -> client
export type ClientPayloads = {
    "StartGame": { gamemode: "Singleplayer" | "Multiplayer" },
    "NumPlayers": { numPlayers: number },
    "SendMessage": { message: string },
    "QueueGame": null,
    "Update": { state: SocketState },
} 

export type ClientActionTypes = keyof ClientPayloads
export type ClientActions = { [K in ClientActionTypes]: ClientAction<K> }[ClientActionTypes]

export const clientStartGameAction = (gamemode: "Singleplayer" | "Multiplayer"): ClientAction<"StartGame"> => createClientAction("StartGame", { gamemode })
export const clientUpdateAction = (state: SocketState): ClientAction<"Update"> => createClientAction("Update", { state })
export const clientQueueGameAction = (): ClientAction<"QueueGame"> => createClientAction("QueueGame", null)

// ======
// Server Actions
// ======

// client -> server
export type ServerPayloads = {
    Update: { state: State },
    Queue: null,
}
export type ServerActionTypes = keyof ServerPayloads
export type ServerActions = { [K in ServerActionTypes]: ServerAction<K> }[ServerActionTypes]

export const serverQueueAction = (): ServerAction<"Queue"> => createServerAction("Queue", null)
export const serverUpdateAction = (state: State): ServerAction<"Update"> => createServerAction("Update", { state })











/**
 * The piece template is the blueprint for a particular piece.
 * It contains the cells that make up the piece, the color of the piece, and the rotation type.
 */
export type PieceTemplate = Readonly<{
    cells: CellCoords[], // the cells that make up the piece
    color: string, // the color of the piece
    rotationType: RotationType, // the rotation type of the piece
    canWallKick: boolean, // whether the piece can wall kick, good for custom pieces to not wall kick
    spawnOffset?: CellCoords, // some blocks spawn incorrectly especially if they are 4x4, so this is used to offset the spawn position
}>

/**
 * This is the type for the actual piece, created by the template.
 */
export type Piece = Readonly<{
    readonly blocks: ReadonlyArray<Block>,
    readonly rotationType: Readonly<RotationType>,
    
    // Rotation is used when calculating wall kicks, so it must be kept track of.
    readonly rotation: Readonly<number>,
    readonly template: Readonly<PieceTemplate> // keep a reference to the template for easy access
}>

/**
 * A block is one square on the board. It has one coordinate relative to the piece and one coordinate relative to the board.
 * Both coordinates are needed because if the piece is rotated, the relative coordinates of the blocks change while the 
 * absolute coordinates of the blocks stay the same. Also, when a piece settles on the board, the blocks need to be separate from
 * the piece they belong to.
 */
export type Block = Readonly<{
    readonly cell: Readonly<CellCoords>,
    readonly position: Readonly<CellCoords>,
    readonly color: string,
    readonly id: string, // unique identifier, used when rendering to minimise redraws or DOM manipulation
}>

/**
 * Cell contains x and y coordinates for a cell, either relative to the piece or relative to the board.
 * [x, y] for cell
 */
export type CellCoords = Readonly<[number, number]>

/**
 * Rotation type determines how a piece will have it's rotations calculated.
 * THREE means that the piece will be assumed to occupy a 3x3 matrix.
 * FOUR means that the piece will be assumed to occupy a 4x4 matrix.
 */
export enum RotationType {
    THREE,
    FOUR
}

export enum Sounds {
    HOLD = "sounds/hold.mp3",
    SETTLE = "sounds/settle.mp3",
    ROTATE = "tetrisnoises/rotate.mp3",
    BACKGROUND = "tetrisnoises/background.mp3",
    CLEAR = "tetrisnoises/1linesclear.mp3",
    CLEAR2 = "tetrisnoises/clearline.mp3",
    FOURCLEAR = "sounds/4lineclear.mp3",
}

/**
 * Lazy sequence type, for generating custom lazy sequences
 * This is very helpful
 */
export interface LazySequence<T> {
    value: T;
    next(s?: State): LazySequence<T>;
}

// Rendering types
export type RenderingType = "SVG" | "WebGL"

// Initial State
export type State = Readonly<{
    start: boolean, // whether the game has started or not
    gameEnd: boolean, // whether the game is finished or not
    blocks: ReadonlyArray<Block>, // blocks that have settled
    domExit: ReadonlyArray<Block>, // the elements that will be removed from the DOM / view
    objCount: number, // the number of objects that have been created, good for creating IDs with
    active: Readonly<Piece> | null, // the active piece that is currently being moved
    activeSettled: boolean, // whether the active piece has settled or not
    nextPiece: LazySequence<Piece>, // the next piece that will be created
    score: number, // the score of the game
    highScore: number, // the high score of the game
    movedBeforeSettled: boolean, // if the active piece couldnt move, it's game over
    linesCleared: number, // number of lines cleared in total
    comboCount: number, // number of lines cleared in a row
    level: number, // difficulty level we are on
    dropInterval: number, // the speed at which the piece drops
    ticksElapsed: number, // the number of ticks elapsed before the next drop
    soundsToPlay: ReadonlyArray<Sounds>, // sounds to play in the side effects
    hash: LazySequence<number>, // the hash of the game state
    holding: Readonly<Piece> | null, // the piece that is being held
    canHold: boolean, // whether the piece can be held or not
    paused: boolean, // whether the game is paused or not
}>;