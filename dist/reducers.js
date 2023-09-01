"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionReducer = exports.clientActionTransformer = void 0;
const actions_1 = require("./actions");
const clientTypes_1 = require("./clientTypes");
const newSession = (player1) => ({
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
});
const filterState = (state) => ({
    blocks: state.blocks,
    gameEnd: state.gameEnd,
    domExit: state.domExit,
    objCount: state.objCount,
    active: state.active,
    score: state.score,
    paused: state.paused,
});
const clientActionTransformer = (client) => (message) => {
    const parsedAction = JSON.parse(message.toString());
    switch (parsedAction.type) {
        case "Queue":
            {
                return (0, actions_1.queueUserAction)(client);
            }
            ;
        case "Update": return (0, actions_1.backendUpdateAction)(client, filterState(parsedAction.payload.state));
    }
    return null;
};
exports.clientActionTransformer = clientActionTransformer;
const actionReducer = (inState, action) => {
    var _a, _b;
    const state = Object.assign(Object.assign({}, inState), { sessions: Object.entries(inState.sessions).reduce((obj, [key, value]) => {
            // remove all events
            const { player1Actions, player2Actions, globalActions } = value, rest = __rest(value, ["player1Actions", "player2Actions", "globalActions"]);
            return Object.assign(Object.assign({}, obj), { [key]: Object.assign(Object.assign({}, rest), { player1Actions: [], player2Actions: [], globalActions: [] }) });
        }, {}) });
    switch (action.type) {
        case "Queue": {
            const { payload } = action;
            // console.log("Queueing user: " + payload.client.uid)
            // check for empty sessions first
            const emptySession = Object.entries(state.sessions).find(([key, value]) => value.player2 === null);
            // console.log(state.sessions," IN QUEUE")
            if (emptySession) {
                const key = emptySession[0];
                const existingSession = emptySession[1];
                if (existingSession.player1.uid === payload.client.uid) {
                    return state; // don't do anything if the player is already in the session
                }
                return Object.assign(Object.assign({}, state), { sessions: Object.assign(Object.assign({}, state.sessions), { [key]: Object.assign(Object.assign({}, existingSession), { player2: payload.client, started: true, globalActions: [(0, clientTypes_1.clientStartGameAction)("Multiplayer")] }) }) });
            }
            return Object.assign(Object.assign({}, state), { sessions: Object.assign(Object.assign({}, state.sessions), { [payload.client.uid]: newSession(payload.client) }) });
        }
        case "StartServer": {
            return Object.assign({}, state);
        }
        case "Connect": {
            const { payload } = action;
            return Object.assign(Object.assign({}, state), { clients: [...state.clients, payload.client], clientStates: Object.assign(Object.assign({}, state.clientStates), { [payload.client.toString()]: payload.state }) });
        }
        case "Disconnect": {
            const { payload } = action;
            return Object.assign(Object.assign({}, state), { clients: state.clients.filter(client => client !== payload.client), clientStates: Object.assign({}, Object.entries(state.clientStates)
                    .filter(([key, value]) => key !== payload.client.toString())
                    .reduce((obj, [key, value]) => (Object.assign(Object.assign({}, obj), { [key]: value })), {})), sessions: Object.assign({}, Object.entries(state.sessions)
                    .filter(([key, value]) => value.player1 !== payload.client && value.player2 !== payload.client)
                    .reduce((obj, [key, value]) => (Object.assign(Object.assign({}, obj), { [key]: value })), {})) });
        }
        case "Update": {
            const { payload } = action;
            const clientState = filterState(payload.state);
            const session = Object.values(state.sessions).filter((session) => session.player1 === payload.client || session.player2 === payload.client)[0];
            return Object.assign(Object.assign({}, state), { clientStates: Object.assign(Object.assign({}, state.clientStates), { [payload.client.uid]: payload.state }), sessions: Object.assign(Object.assign({}, state.sessions), (session ? {
                    [payload.client.uid]: Object.assign(Object.assign({}, session), { player1State: session.player1.uid === payload.client.uid ? payload.state : session.player1State, player2State: ((_a = session.player2) === null || _a === void 0 ? void 0 : _a.uid) === payload.client.uid ? payload.state : session.player2State, player1Actions: ((_b = session.player2) === null || _b === void 0 ? void 0 : _b.uid) === payload.client.uid ? session.player1Actions.concat((0, clientTypes_1.clientUpdateAction)(clientState)) : [], player2Actions: session.player1.uid === payload.client.uid ? session.player2Actions.concat((0, clientTypes_1.clientUpdateAction)(clientState)) : [], globalActions: [] })
                } : {})) });
        }
        default: return state;
    }
};
exports.actionReducer = actionReducer;
