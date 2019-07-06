/**
 * room.js
 * 
 * Module for handling events in a chatroom
 */
'use strict';

/**
 * Constants
 */
const EXPIRY_REGEX = /^(a|an|\d+)\s*(year|month|day|hour|minute|second)s*$/i,
      EXPIRY_FRAGMENTS = {
          second: 1,
          minute: 1 * 60,
          hour:   1 * 60 * 60,
          day:    1 * 60 * 60 * 24,
          month:  1 * 60 * 60 * 24 * 30,
          year:   1 * 60 * 60 * 24 * 365
      },
      MESSAGE_LIMIT = 1000;

/**
 * Importing modules
 */
const EventEmitter = require('events'),
      User = require('./user.js'),
      util = require('./util.js'),
      Socket = require('./socket.js'),
      Message = require('./msg.js'),
      IO = require('./io.js');

/**
 * For handling chat events
 * @class Room
 * @augments EventEmitter
 */
class Room extends EventEmitter {
    /**
     * Class constructor
     * @constructor
     * @param {Client} client Client instance
     * @param {String} wiki Domain of the room
     * @param {Room} parent Parent room
     * @param {Number} id Room ID
     * @param {Array<String>} users Users in the PM
     */
    constructor(client, wiki, parent, id, users) {
        super();
        this._client = client;
        this._io = new IO(client.token);
        this._wiki = wiki;
        this._users = {};
        this._userCount = 0;
        if(parent) {
            console.log(`Private room: ${id}, ${users}`);
            this._parent = parent;
            this._id = id;
            this._privateUsers = users;
            this._initParent();
        } else {
            this._privateRooms = {};
            Promise.all([
                this._initDomain(),
                this._initInfo()
            ]).then(this._initSocket.bind(this));
        }
    }
    /**
     * Initializes the chat socket
     * @method _initSocket
     * @private
     */
    _initSocket() {
        // TODO: This is hacky
        if(this._id && this._wikiId) {
            this._socket = new Socket(this);
        }
    }
    /**
     * Searches for the room ID for the given domain
     * @method _initDomain
     * @private
     * @returns {Promise} Promise on which to listen for callback
     */
    _initDomain() {
        return this._io.get(util.wikiScript(this._wiki, 'wikia'), {
            controller: 'Chat',
            format: 'json'
        }).then((function(data) {
            this._id = Number(data.roomId);
            this._key = data.chatkey;
            this._host = data.chatServerHost;
            this._port = Number(data.chatServerPort);
        }).bind(this)).catch(e => this.emit('error', 'domain', e));
    }
    /**
     * Searches for the wiki ID for the given domain and fetches
     * user information
     * @method _initInfo
     * @private
     * @todo Make this run at the same time as _initDomain?
     * @todo Make this fetch more than just the ID?
     * @returns {Promise} Promise on which to listen for callback
     */
    _initInfo() {
        this._io.api(this._wiki, 'query', {
            meta: 'siteinfo|userinfo',
            siprop: 'wikidesc',
            uiprop: 'blockinfo|groups|rights|options',
            prop: 'info',
            titles: '#',
            intoken: 'edit'
        }).then((function(data) {
            const q = data.query,
                  id = Number(q.wikidesc.id);
            delete q.wikidesc;
            this._user = new User(q, true);
            if(util.includes(this._user.rights, 'chat')) {
                this._wikiId = id;
            } else {
                this.emit('error', 'permission');
            }
        }).bind(this)).catch(e => this.emit('error', 'id', e));
    }
    /**
     * Takes chat information from parent chatroom
     * @method _initParent
     * @private
     */
    _initParent() {
        this._user = this._parent.user;
        ['host', 'port', 'key', 'wikiId', 'io'].forEach(
            prop => this[`_${prop}`] = this._parent[prop]
        );
        this._initSocket();
    }
    /**
     * Called after a socket event happens
     * @method event
     * @param {Array} args Event arguments
     */
    event(args) {
        util.verifyArgs(arguments, ['array']);
        switch(args[0]) {
            case 'connect':
                this._connected = true;
                this._closeReason = undefined;
                if(args[1] === 'data') {
                    this.command('initquery');
                }
                this.emit('connect', args[1]);
                break;
            case 'close':
                this._connected = false;
                this._initialized = false;
                this._closeReason = args[1];
                this.emit('disconnect', args[1]);
                break;
            case 'error':
            case 'unknown':
            case 'ping':
            case 'pong':
            case 'raw':
            case 'noop':
                this.emit.apply(this, args);
                break;
            case 'event':
                const data = args[1];
                let event = data.event;
                if(event === 'chat:add') {
                    event = 'message';
                }
                const func = util.func(this, '_event', event);
                if(!func) {
                    this.emit('unknown', 'event', 'chat', event);
                    return;
                }
                func.call(
                    this,
                    typeof data.data === 'string' ?
                        JSON.parse(data.data) :
                        typeof data.data === 'object' ?
                            data.data :
                            data
                );
                break;
            default:
                this.emit('unknown', 'event', 'socket', args[0]);
                break;
        }
    }
    /**
     * Event fired on initial fetching of users and scrollback messages
     * @method _eventInitial
     * @private
     * @param {Object} data Event data
     */
    _eventInitial(data) {
        const coll = data.collections,
              users = coll.users.models;
        users.forEach(function(u) {
            const user = new User(u);
            this._users[user.name] = user;
        }, this);
        this._userCount = users.length;
        coll.chats.models.forEach(this._eventMessage, this);
        this.emit('initial');
        this._initialized = true;
    }
    /**
     * Event fired when a message gets sent into chat
     * @method _eventMessage
     * @private
     * @param {Object} data Event data
     */
    _eventMessage(data) {
        this.emit('message', new Message(data));
    }
    /**
     * Event fired when a user's status information updates
     * @method _eventUpdateUser
     * @private
     * @param {Object} data Event data
     */
    _eventUpdateUser(data) {
        const user = new User(data);
        if(!(user.name in this._users)) {
            ++this._userCount;
        }
        this._users[user.name] = user;
        this.emit('updateUser', user);
    }
    /**
     * Event fired when a user joins the chat
     * @method _eventJoin
     * @private
     * @param {Object} data Event data
     * @todo DRY
     */
    _eventJoin(data) {
        const user = new User(data);
        let rejoin;
        if(user.name in this._users) {
            rejoin = true;
        } else {
            ++this._userCount;
        }
        this._users[user.name] = user;
        this.emit('join', user, rejoin);
    }
    /**
     * Event fired when a user leaves the chat
     * @method _eventPart
     * @private
     * @param {Object} data Event data
     */
    _eventPart(data) {
        let user, ghost;
        if(data.name in this._users) {
            --this._userCount;
            user = this._users[user.name];
            delete this._users[user.name];
        } else {
            user = new User(data);
            ghost = true;
        }
        this.emit('part', user, ghost);
        this.emit('leave', user, ghost);
    }
    /**
     * Event fired when a user sends a logout signal to chat
     * @method _eventLogout
     * @private
     * @param {Object} data Event data
     * @todo DRY
     */
    _eventLogout(data) {
        let user, ghost;
        if(data.name in this._users) {
            --this._userCount;
            user = this._users[user.name];
            delete this._users[user.name];
        } else {
            user = new User(data);
            ghost = true;
        }
        this.emit('logout', user, ghost);
        this.emit('leave', user, ghost);
    }
    /**
     * Event fired when a user gets kicked from chat
     * @method _eventKick
     * @private
     * @param {Object} data Event data
     */
    _eventKick(data) {
        data = data.attrs;
        this.emit('kick', data.kickedUserName, data.moderatorName);
    }
    /**
     * Event fired when a user gets banned from chat
     * @method _eventBan
     * @private
     * @param {Object} data Event data
     */
    _eventBan(data) {
        data = data.attrs;
        const time = Number(data.time);
        this.emit(
            time === 0 ? 'unban' : 'ban',
            data.kickedUserName,
            data.moderatorName,
            time,
            data.reason
        );
    }
    /**
     * Event fired when a user sends a message to a private room
     * @method _eventOpenPrivateRoom
     * @private
     * @param {Object} data Event data
     */
    _eventOpenPrivateRoom(data) {
        data = data.attrs;
        this.emit(
            'openPrivate',
            Number(data.roomId),
            data.users,
            this.openPrivate(data.users, Number(data.roomId))
        );
    }
    /**
     * Event fired when the server forcibly reconnects the user
     * Usually happens after a kick
     * @method _eventForceReconnect
     * @private
     * @param {Object} data Event data
     */
    _eventForceReconnect(data) {
        this.reconnect();
        this.emit('forceReconnect', data);
    }
    /**
     * Event fired when the server asks the user not to reconnect
     * Usually happens after a ban
     * @method _eventDisableReconnect
     * @private
     * @param {Object} data Event data
     */
    _eventDisableReconnect(data) {
        this.emit('disableReconnect', data);
    }
    /**
     * Event fired when the user sends a too long message
     * @method _eventLongMessage
     * @private
     * @param {Object} data Event data
     */
    _eventLongMessage(data) {
        this.emit('longMessage', data.user);
    }
    /**
     * Event fired when the server sends meta information to the client
     * @method _eventMeta
     * @private
     * @param {Object} data Event data
     */
    _eventMeta(data) {
        this._server = {
            hostname: data.serverHostname,
            version: data.serverVersion
        };
        this.emit('meta', this._server);
    }
    /**
     * Normalizes expiry time
     * @method _getExpiry
     * @private
     * @param {String|Number} expiry Expiry time to normalize
     * @returns {Number} Normalized expiry time
     * @todo Allow format of "2 years, 1 day"
     */
    _getExpiry(expiry) {
        if(typeof expiry === 'number') {
            return expiry;
        } else if(typeof expiry === 'string') {
            if(isNaN(Number(expiry))) {
                const res = EXPIRY_REGEX.exec(expiry);
                EXPIRY_REGEX.lastIndex = 0;
                if(!res) {
                    return null;
                }
                let num = res.shift();
                if(num === 'a' || num === 'an') {
                    num = 1;
                } else {
                    num = Number(num);
                }
                const unit = EXPIRY_FRAGMENTS[res.shift()];
                if(!unit) {
                    return null;
                } else {
                    return num * unit;
                }
            } else {
                return Number(expiry);
            }
        } else {
            return null;
        }
    }
    /**
     * Posts a command to the chat server
     * @method command
     * @param {String} command Command to post
     * @param {Object} args Arguments of the command
     * @returns {Boolean} If pre-post checks passed
     */
    command(command, args) {
        if(typeof command !== 'string' || !this._connected) {
            return false;
        }
        this._socket.post(Object.assign({
            msgType: 'command',
            command: command
        }, args));
        return true;
    }
    /**
     * Kicks a user from the room
     * @method kick
     * @param {String|User} user User to kick
     * @returns {Boolean} If pre-kick checks passed
     */
    kick(user) {
        user = util.getUser(user);
        if(!user || !this._user.canKickBan) {
            return false;
        }
        return this.command('kick', { userToKick: user });
    }
    /**
     * Bans a user from the room
     * @method ban
     * @param {String|User} user User to ban
     * @param {String|Number} length Length of the ban
     * @param {String} reason Reason for the ban
     * @returns {Boolean} If pre-ban checks passed
     * @todo If this fails sometimes, use the ajax endpoint for banning
     */
    ban(user, length, reason) {
        user = util.getUser(user);
        length = this._getExpiry(length);
        reason = reason || '';
        if(!user || !length || !this._user.canKickBan) {
            return false;
        }
        return this.command('ban', {
            userToBan: user,
            reason: reason,
            time: length
        });
    }
    /**
     * Unbans a user from the room
     * @method unban
     * @param {String|User} user User to unban
     * @param {String} reason Reason for the unban
     * @returns {Boolean} If pre-unban checks passed
     */
    unban(user, reason) {
        return this.ban(user, 0, reason);
    }
    /**
     * Opens a private room with specified user(s)
     * @method openPrivate
     * @param {Array<String|User>|String|User} users Users in the private room
     * @param {Number} id Room ID of the private room
     * @returns {Boolean} If pre-open checks passed
     */
    openPrivate(users, id) {
        if(this._parent) {
            return this._parent.openPrivate(users, id);
        }
        if(users instanceof Array) {
            users = users.map(util.getUser, this);
        } else {
            users = util.getUser(users);
            if(!users) {
                return false;
            }
            users = [users];
        }
        if(
            this._client.blocked
                .concat(this._client.blockedBy)
                .find(el => util.includes(users, el))
        ) {
            return false;
        }
        if(id) {
            if(id in this._privateRooms) {
                return false;
            }
            this._privateRooms[id] = new Room(
                this._client,
                this._wiki,
                this,
                id,
                users
            );
        } else {
            this._io.ajax(this._wiki, 'getPrivateRoomId', {
                users: JSON.stringify(users),
                token: this._user.token
            }).done(data => this.openPrivate(users, Number(data.id)));
        }
        return true;
    }
    /**
     * Sets a user's status
     * @method setStatus
     * @param {String} state Status state to set
     * @param {String} message Status message to set
     * @returns {Boolean} If pre-set checks passed
     */
    setStatus(state, message) {
        return this.command('setstatus', {
            statusState: state,
            statusMessage: message
        });
    }
    /**
     * Sends a message to the chat room
     * @method send
     * @param {String} text Text to send
     * @returns {Boolean} If pre-send checks passed
     */
    send(text) {
        if(typeof text !== 'string' || !this._connected) {
            return false;
        }
        text = text.trim();
        if(text.length === 0 || text.length > MESSAGE_LIMIT) {
            // There is no point in sending an empty or too long message
            return false;
        }
        if(this._parent) {
            this._parent.command('openprivate', {
                roomId: this._id,
                users: this._userCount
            });
        }
        this._socket.post({
            msgType: 'chat',
            text: text,
            name: this._user.name
        });
        return true;
    }
    /**
     * Reconnects to the server
     * @method reconnect
     */
    reconnect() {
        this._socket.close('reconnect');
        this._initSocket();
    }
    /**
     * Leaves the room
     * @method kill
     */
    kill() {
        this.command('logout');
        if(this._socket) {
            this._socket.close('kill');
        }
        if(this._privateRooms) {
            util.each(this._privateRooms, (k, v) => v.kill(), this);
        } else {
            this._parent.killPrivate(this);
        }
    }
    /**
     * Leaves the room
     * @method leave
     * @alias kill
     */
    leave() {
        this.kill();
    }
    /**
     * Leaves the room
     * @method
     * @alias kill
     */
    part() {
        this.kill();
    }
    /**
     * Finishes leaving of a private room
     * @method killPrivate
     * @param {Room} room Room to leave
     */
    killPrivate(room) {
        if(this._parent) {
            this._parent.killPrivate(room);
        } else if(room.connected) {
            room.kill();
        } else {
            delete this._privateRooms[room.id];
        }
    }
    /**
     * Blocks a user from private messaging the client
     * @method block
     * @param {String|User} user User to block
     * @returns {Boolean} If pre-block checks passed
     */
    block(user) {
        return this._client.block(user, this);
    }
    /**
     * Unblocks a user from private messaging the client
     * @method unblock
     * @param {String|User} user User to block
     * @returns {Boolean} If pre-unblock checks passed
     */
    unblock(user) {
        return this._client.unblock(user, this);
    }
    /**
     * Gets the chat room ID
     * @return {Number} Room ID
     */
    get id() {
        return this._id;
    }
    /**
     * Gets the chat socket
     * @return {Socket} Chat socket
     */
    get socket() {
        return this._socket;
    }
    /**
     * Gets the current user
     * @return {User} The current user
     */
    get user() {
        return this._user;
    }
    /**
     * Gets the room domain
     * @return {String} Room's domain
     */
    get wiki() {
        return this._wiki;
    }
    /**
     * Gets the parent chat room
     * @return {Room} Parent chat room
     */
    get parent() {
        return this._parent;
    }
    /**
     * Gets the users in the room
     * @return {Object} Users in the room
     */
    get users() {
        return this._users;
    }
    /**
     * Gets the number of users in the room
     * @return {Number} Number of users in the room
     */
    get userCount() {
        return this._userCount;
    }
    /**
     * Gets the users of a private room
     * @return {Array<String>} Users of a private room
     */
    get privateUsers() {
        return this._privateUsers;
    }
    /**
     * Gets if the room is connected
     * @return {Boolean} If the room is connected
     */
    get connected() {
        return this._connected;
    }
    /**
     * Gets the reason for the room's closure
     * @return {String} The reason for room's closure
     */
    get closeReason() {
        return this._closeReason;
    }
    /**
     * Gets if the initial event has been received
     * @return {Boolean} If the inital event has been received
     */
    get initialized() {
        return this._initialized;
    }
    /**
     * Gets all private rooms
     * @returns {Object} Private rooms
     */
    get privateRooms() {
        return this._privateRooms;
    }
    /**
     * Gets information about the chat server
     * @returns {Object} Chat server information
     */
    get server() {
        return this._server;
    }
    /**
     * Gets the room's HTTP client
     * @returns {IO} Room's HTTP client
     */
    get io() {
        return this._io;
    }
    /**
     * Gets the chat server host
     * @returns {String} Chat server host
     */
    get host() {
        return this._host;
    }
    /**
     * Gets the chat server port
     * @returns {String}
     */
    get port() {
        return this._port;
    }
    /**
     * Gets the wiki ID
     * @returns {Number} Wiki ID
     */
    get wikiId() {
        return this._wikiId;
    }
    /**
     * Gets the chat key
     * @returns {String} Chat key
     */
    get key() {
        return this._key;
    }
}

module.exports = Room;
