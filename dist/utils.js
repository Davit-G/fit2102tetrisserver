"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyState = void 0;
const reducers_1 = require("./reducers");
/**
 * Lazy sequence generator for the server state
 * @param startState
 * @returns
 */
function lazyState(startState) {
    return function _next(action, state) {
        const newState = (0, reducers_1.actionReducer)(state, action);
        return {
            value: newState,
            next: (action) => _next(action, newState)
        };
    }({ type: "StartServer" }, startState);
}
exports.lazyState = lazyState;
