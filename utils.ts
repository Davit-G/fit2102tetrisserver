import { BackendAction, BackendActions, startServerAction } from "./actions";
import { ServerState, actionReducer } from "./reducers";

/**
 * Lazy sequence type, for generating custom lazy sequences
 * This is very helpful
 */
export interface LazySequence<T> {
    value: T;
    next(action?: BackendActions): LazySequence<T>;
}

/**
 * Lazy sequence generator for the server state
 * @param startState 
 * @returns 
 */
export function lazyState(startState: ServerState): LazySequence<ServerState> {
    return function _next(action: BackendActions, state: ServerState): LazySequence<ServerState> {
        const newState = actionReducer(state, action);

        return {
            value: newState,
            next: (action: BackendActions) => _next(action, newState)
        }
    }(startServerAction(), startState)
}