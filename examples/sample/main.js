/**
 * main.js
 * 
 * Main module for the sample
 */
'use strict';

/**
 * Importing modules
 */
const Client = require('../..').Client,
      events = require('./events.js');

/**
 * Constants
 */
const CLIENT_EVENTS = [
    'error',
    'init',
    'join',
    'leave',
    'block',
    'unblock'
];

/**
 * Main class
 * @class Main
 */
class Main {
    constructor() {
        this._read = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this._prompt();
    }
    _prompt() {
        this._read.question('Enter username: ', username =>
            this._read.question('Enter password: ', password =>
                this._init(username, password)
            )
        );
    }
    _init(username, password) {
        this._client = new Client({
            username: username,
            password: password
        });
        CLIENT_EVENTS.forEach(e => this._client.on(e, events.client[e]));
    }
    _getCom(prefix, name) {
        return this[
            `_${prefix}${name.charAt(0).toUpperCase()}${name.substring(1)}`
        ];
    }
    command() {
        this._read.question('> ', (function(command) {
            const split = command.split(' '),
                  name = split.shift();
            let func;
            if(name.startsWith('#')) {
                const room = this._client.getRoom(name.substring(1)),
                      com = split.shift();
                if(!room) {
                    console.log('Unknown room!');
                    return;
                }
                split.unshift(room);
                func = this._getCom('comRoom', com);
            } else {
                func = this._getCom('com', name);
            }
            if(!func) {
                console.log('Unknown command!');
            } else {
                const ret = func.apply(this, split);
                if(typeof ret === 'string') {
                    console.log(ret);
                }
            }
            this.command();
        }).bind(this));
    }
    _getArgs(args) {
        return Array.prototype.slice.call(args);
    }
    _comJoin(domain) {
        if(domain) {
            this._client.join(domain);
        } else {
            return 'Domain not specified!';
        }
    }
    _comLeave(domain) {
        if(domain) {
            this._client.leave(domain);
        } else {
            return 'Domain not specified!';
        }
    }
    _comRoomBlock() {
        const args = this._getArgs(arguments),
              room = args.shift(),
              user = args.join(' ');
        if(user) {
            room.block(user);
        } else {
            return 'User not specified!';
        }
    }
    _comRoomUnblock() {
        const args = this._getArgs(arguments),
              room = args.shift(),
              user = args.join(' ');
        if(user) {
            room.unblock(user);
        } else {
            return 'User not specified!';
        }
    }
    _comRoomSend() {
        const args = this._getArgs(arguments),
              room = args.shift();
        room.send(args.join(' '));
    }
    _comRoomKick(room, user) {
        if(!room.kick(user)) {
            return 'Kick unsuccessful!';
        }
    }
    _comRoomBan() {
        const args = this._getArgs(arguments);
        if(!args.shift().ban(args.shift(), args.shift(), args.join(' '))) {
            return 'Ban unsuccessful!';
        }
    }
    _comRoomKill(room) {
        room.kill();
    }
    _comRoomPM(room, users) {
        const args = this._getArgs(arguments),
              room = args.shift();
    }
}

global.main = new Main();