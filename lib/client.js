/**
 * client.js
 * 
 * Module for handling chatrooms
 */
'use strict';

/**
 * Importing modules
 */
const EventEmitter = require('events'),
      IO = require('./io.js'),
      Room = require('./room.js'),
      util = require('./util.js');

/**
 * Constants
 */
const DEFAULT_CONFIG = {
    ping: 0.5,
    autoJoin: []
};

/**
 * Handles multiple Wikia chatrooms
 * @class Client
 */
class Client extends EventEmitter {
    /**
     * Class constructor
     * @constructor
     * @param {Object} config Client configuration
     */
    constructor(config) {
        super();
        this._initConfig(config);
        this._io = new IO();
        this._rooms = {};
        this._initUser()
            .then(this.refreshBlocks.bind(this))
            .then(this._initEnd.bind(this));
    }
    /**
     * Initializes and verifies the configuration
     * @method _initConfig
     * @private
     * @param {Object} config Configuration object
     */
    _initConfig(config) {
        config = Object.assign(DEFAULT_CONFIG, config);
        if(
            typeof config.username !== 'string' ||
            typeof config.password !== 'string'
        ) {
            throw new Error('No username or password provided!');
        }
        this._username = config.username;
        if(typeof config.ping !== 'number' || config.ping > 1) {
            config.ping = DEFAULT_CONFIG.ping;
        }
        if(!(config.autoJoin instanceof Array)) {
            config.autoJoin = [];
        }
        this._config = config;
    }
    /**
     * Logs the user into Wikia
     * @method _initUser
     * @private
     * @returns {Promise} Promise on which to wait for response
     */
    _initUser() {
        return this._io.post('https://services.wikia.com/auth/token', {
            username: this._username,
            password: this._config.password
        }).then((function(data) {
            this._token = data.access_token;
        }).bind(this)).catch(e => this.emit('error', 'login', e));
    }
    /**
     * Initializes data about private message blocks
     * @method refreshBlocks
     * @private
     */
    refreshBlocks() {
        if(!this._token) {
            return;
        }
        return this._io.ajax('community', 'getPrivateBlocks')
            .then((function(data) {
                this._blocked = data.blockedChatUsers;
                this._blockedBy = data.blockedByChatUsers;
            }).bind(this))
            .catch(e => this.emit('error', 'blocks', e));
    }
    /**
     * Initializes leftover things to be initialized
     * @method _initEnd
     * @private
     */
    _initEnd() {
        this._config.autoJoin.forEach(room => this.join(room));
        this.emit('init');
    }
    /**
     * Joins a chatroom
     * @method join
     * @param {String} domain Domain of the chatroom
     */
    join(domain) {
        if(this._rooms[domain]) {
            throw new Error('Already joined the chatroom!');
        }
        const room = new Room(this, domain);
        this._rooms[domain] = room;
        this.emit('join', room);
    }
    /**
     * Leaves a chatroom
     * @method leave
     * @param {String} domain Domain of the room to leave
     */
    leave(domain) {
        const room = this._rooms[domain];
        if(!room) {
            throw new Error('Room wasn\'t joined!');
        }
        room.kill();
        delete this._rooms[domain];
        this.emit('leave', room);
    }
    /**
     * Gets a room by domain
     * @method getRoom
     * @param {String} domain Domain the room is on
     * @returns {Room} Room with the specified domain
     */
    getRoom(domain) {
        return this._rooms[domain];
    }
    /**
     * Base method for blocking/unblocking a user
     * from private messaging the client
     * @method _baseBlock
     * @private
     * @param {String|User} user User to block/unblock
     * @param {Room} room Room to use for blocking
     * @param {Boolean} unblock If to unblock the user
     * @returns {Promise} Promise on which to listen for callback
     */
    _baseBlock(user, room, unblock) {
        user = util.getUser(user);
        // TODO: Find out why is JSHint complaining about XOR below
        if(!user || !room || (util.includes(this._blocked, user) ^ unblock)) { // jshint ignore: line
            console.log(util.includes(this._blocked, user), unblock);
            return null;
        }
        return this._io.ajax('community', 'blockOrBanChat', {
            userToBan: user,
            dir: unblock ? 'remove' : 'add',
            token: room.user.token
        }).catch(e => this.emit('error', 'block', user, room, e));
    }
    /**
     * Blocks a user from private messaging the client
     * @method block
     * @param {String|User} user User to block
     * @param {Room} room Room to use for blocking
     * @returns {Boolean} If pre-block checks passed
     */
    block(user, room) {
        const base = this._baseBlock(user, room, false);
        if(!base) {
            return false;
        }
        base.then((function(data) {
            console.log(data);
            this._blocked.push(user);
            this.emit('block', user);
        }).bind(this));
        return true;
    }
    /**
     * Unblocks a user from private messaging the client
     * @method unblock
     * @param {String|User} user User to unblock
     * @param {Room} room Room to use for blocking
     * @returns {Boolean} If pre-unblock checks passed
     */
    unblock(user, room) {
        const base = this._baseBlock(user, room, true);
        if(!base) {
            return false;
        }
        base.then((function(data) {
            console.log(data);
            this._blocked.splice(this._blocked.indexOf(user), 1);
            this.emit('unblock', user);
        }).bind(this));
        return true;
    }
    /**
     * Kills the client
     * @method kill
     */
    kill() {
        if(this._rooms) {
            util.each(this._rooms, room => room.kill());
        }
    }
    /**
     * Gets user name
     * @returns {String} User name
     */
    get username() {
        return this._username;
    }
    /**
     * Gets user token
     * @returns {String} User token
     */
    get token() {
        return this._token;
    }
    /**
     * Gets users whose PMs are blocked
     * @returns {Array<String>} Users whose PMs are blocked
     */
    get blocked() {
        return this._blocked;
    }
    /**
     * Gets users who blocked our PMs
     * @returns {Array<String>} Users who blocked our PMs
     */
    get blockedBy() {
        return this._blockedBy;
    }
    /**
     * Gets the client's rooms
     * @returns {Object} Map of client's rooms
     */
    get rooms() {
        return this._rooms;
    }
}

module.exports = Client;
