"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sounds = exports.RotationType = exports.updateAction = exports.queueAction = exports.startGameAction = exports.pauseAction = exports.holdAction = exports.fallAction = exports.tickAction = exports.resetGameAction = exports.dropAction = exports.moveAction = exports.rotateAction = exports.createServerAction = exports.createClientAction = exports.createStateAction = exports.createAction = void 0;
// Utility function for creating actions
const createAction = (type, payload, destination) => ({ type, payload, destination });
exports.createAction = createAction;
const createStateAction = (type, payload) => (0, exports.createAction)(type, payload, "State");
exports.createStateAction = createStateAction;
const createClientAction = (type, payload) => (0, exports.createAction)(type, payload, "Client");
exports.createClientAction = createClientAction;
const createServerAction = (type, payload) => (0, exports.createAction)(type, payload, "Server");
exports.createServerAction = createServerAction;
// Create actions using the utility function
const rotateAction = (rotationDirection) => (0, exports.createStateAction)('Rotate', { rotationDirection });
exports.rotateAction = rotateAction;
const moveAction = (direction) => (0, exports.createStateAction)('Move', { direction });
exports.moveAction = moveAction;
const dropAction = () => (0, exports.createStateAction)('Drop', null);
exports.dropAction = dropAction;
const resetGameAction = () => (0, exports.createStateAction)('ResetGame', null);
exports.resetGameAction = resetGameAction;
const tickAction = (elapsed) => (0, exports.createStateAction)('Tick', { elapsed });
exports.tickAction = tickAction;
const fallAction = () => (0, exports.createStateAction)('Fall', null);
exports.fallAction = fallAction;
const holdAction = () => (0, exports.createStateAction)('Hold', null);
exports.holdAction = holdAction;
const pauseAction = () => (0, exports.createStateAction)('Pause', null);
exports.pauseAction = pauseAction;
const startGameAction = (gamemode) => (0, exports.createStateAction)('StartGame', gamemode);
exports.startGameAction = startGameAction;
const queueAction = () => (0, exports.createServerAction)("Queue", null);
exports.queueAction = queueAction;
const updateAction = (state) => (0, exports.createServerAction)("Update", { state });
exports.updateAction = updateAction;
/**
 * Rotation type determines how a piece will have it's rotations calculated.
 * THREE means that the piece will be assumed to occupy a 3x3 matrix.
 * FOUR means that the piece will be assumed to occupy a 4x4 matrix.
 */
var RotationType;
(function (RotationType) {
    RotationType[RotationType["THREE"] = 0] = "THREE";
    RotationType[RotationType["FOUR"] = 1] = "FOUR";
})(RotationType || (exports.RotationType = RotationType = {}));
var Sounds;
(function (Sounds) {
    Sounds["HOLD"] = "sounds/hold.mp3";
    Sounds["SETTLE"] = "sounds/settle.mp3";
    Sounds["ROTATE"] = "tetrisnoises/rotate.mp3";
    Sounds["BACKGROUND"] = "tetrisnoises/background.mp3";
    Sounds["CLEAR"] = "tetrisnoises/1linesclear.mp3";
    Sounds["CLEAR2"] = "tetrisnoises/clearline.mp3";
    Sounds["FOURCLEAR"] = "sounds/4lineclear.mp3";
})(Sounds || (exports.Sounds = Sounds = {}));
