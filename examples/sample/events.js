/**
 * events.js
 * 
 * Events handler module
 */
'use strict';

/**
 * Defining constants
 */
const ROOM_EVENTS = [
    'connect',
    'disconnect',
    'error',
    'unknown',
    'ping',
    'pong',
    'noop',
    'raw',
    'message',
    'initial',
    'updateUser',
    'join',
    'part',
    'logout',
    'leave',
    'kick',
    'ban',
    'unban',
    'openPrivate',
    'forceReconnect',
    'disableReconnect',
    'longMessage',
    'meta'
];

const Events = {
    client: {
        error: function() {
            console.log('Error: ', arguments);
        },
        init: function() {
            main.command();
        },
        leave: function(room) {
            console.log('Leave: ', room);
        },
        block: function(user) {
            console.log('Block: ', user);
        },
        unblock: function(user) {
            console.log('Unblock: ', user);
        },
        join: function(room) {
            console.log('Join: ', room);
            ROOM_EVENTS.forEach(e => room.on(e, Events.room[e]));
        }
    },
    room: {
        error: function() {
            console.log('Error: ', arguments);
        },
        connect: function(source) {
            console.log('Connect. Source: ', source);
        },
        disconnect: function(reason) {
            console.log('Disconnect. Reason: ', reason);
        },
        unknown: function() {
            console.log('Unknown: ', arguments);
        },
        ping: function() {
            console.log('Ping');
        },
        pong: function() {
            console.log('Pong');
        },
        noop: function() {
            console.log('Noop');
        },
        raw: function(type, data) {
            console.log(`Raw. Type: ${type}, Data: ${data}`);
        },
        message: function(msg) {
            console.log('Message: ', msg);
        },
        initial: function() {
            console.log('Initial');
        },
        updateUser: function(user) {
            console.log('Update user: ', user);
        },
        join: function(user, rejoin) {
            console.log('Join: ', user);
        },
        part: function(user, ghost) {
            console.log('Part: ', user, ' Ghost: ', ghost);
        },
        logout: function(user, ghost) {
            console.log('Logout: ', user, ' Ghost: ', ghost);
        },
        leave: function(user, ghost) {
            console.log('Leave: ', user, ' Ghost: ', ghost);
        },
        kick: function(user, mod) {
            console.log(`${user} was kicked by ${mod}`);
        },
        ban: function(user, mod, length) {
            console.log(`${user} was banned by ${mod} for ${length}`);
        },
        unban: function(user, mod) {
            console.log(`${user} was unbanned by ${mod}`);
        },
        longMessage: function() {
            console.log('Long message');
        },
        forceReconnect: function() {
            console.log('Force reconnect');
        },
        disableReconnect: function() {
            console.log('Disable reconnect');
        },
        openPrivate: function(id, users, success) {
            console.log(`Open private: ID: ${id},
            Users: ${users.join(', ')}, Success: ${success}`);
        },
        meta: function(data) {
            console.log(`Meta: Version: ${data.version},
            Hostname: ${data.hostname}`);
        }
    }
};

module.exports = Events;