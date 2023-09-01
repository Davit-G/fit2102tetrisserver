"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sounds = exports.RotationType = exports.Pause = exports.Hold = exports.Fall = exports.Tick = exports.ResetGame = exports.Drop = exports.Move = exports.Rotate = void 0;
// Action types, derived from workshop work
class Rotate {
    constructor(direction) {
        this.direction = direction;
    }
}
exports.Rotate = Rotate;
class Move {
    constructor(direction) {
        this.direction = direction;
    }
}
exports.Move = Move;
class Drop {
}
exports.Drop = Drop;
class ResetGame {
}
exports.ResetGame = ResetGame;
class Tick {
    constructor(elapsed) {
        this.elapsed = elapsed;
    }
}
exports.Tick = Tick;
class Fall {
}
exports.Fall = Fall;
class Hold {
}
exports.Hold = Hold;
class Pause {
}
exports.Pause = Pause;
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
