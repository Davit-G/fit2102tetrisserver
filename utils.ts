import { ServerAction, ServerActions, StartServer } from "./actions";
import { Actions } from "./clientTypes";
import { ServerState, actionReducer } from "./reducers";

/**
 * Lazy sequence type, for generating custom lazy sequences
 * This is very helpful
 */
export interface LazySequence<T> {
    value: T;
    next(action?: ServerActions): LazySequence<T>;
}

/**
 * Lazy sequence generator for the server state
 * @param startState 
 * @returns 
 */
export function lazyState(startState: ServerState): LazySequence<ServerState> {
    return function _next(action: ServerActions, state: ServerState): LazySequence<ServerState> {
        const newState = actionReducer(state, action);

        return {
            value: newState,
            next: (action: ServerActions) => _next(action, newState)
        }
    }({type: "StartServer"} as StartServer, startState)
}