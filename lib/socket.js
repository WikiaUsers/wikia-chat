/**
 * socket.js
 * 
 * Module for handling socket connections to Wikia chats
 */
'use strict';

/**
 * Handles connections between the chat server and client
 * @class Socket
 */
class Socket {
    /**
     * Class constructor
     * @constructor
     * @param {Room} room Room for which to handle the connection
     */
    constructor(room) {
        this._room = room;
        this._url = `http://${room.host}:${room.port}/socket.io/`;
        this._params = {
            EIO: 2,
            transport: 'polling',
            name: room.user.name,
            key: room.key,
            roomId: room.id,
            serverId: room.wikiId
        };
        this._io = room.io;
        this._retries = 0;
        this._poll();
    }
    /**
     * Sends a request to the chat server
     * @method _request
     * @private
     * @param {String} body POST body of the request
     * @returns {Promise} Promise to listen for response on
     */
    _request(body) {
        return this._io.socket(this._url, this._params, body);
    }
    /**
     * Sends a POST request to the chat server
     * @method post
     * @param {Object} body Request attributes to post
     */
    post(body) {
        body = body ?
            `42${JSON.stringify(['message', JSON.stringify({
                attrs: body
            })])}` :
            '2';
        this._request(`${body.length}:${body}`)
            .then(this._handlePost.bind(this))
            .catch(this._handleError.bind(this));
    }
    /**
     * Polls the chat server
     * @method _poll
     * @private
     */
    _poll() {
        this._request()
            .then(this._handleData.bind(this))
            .catch(this._handleError.bind(this));
    }
    /**
     * Emits events to be passed to the room
     * @method _emit
     * @private
     */
    _emit() {
        this._room.event(Array.prototype.slice.call(arguments));
    }
    /**
     * Handles received data from the socket
     * @method _handleData
     * @private
     * @param {String} data
     */
    _handleData(data) {
        if(typeof data !== 'string') {
            this._emit('error', 'dataFormat', data);
            return;
        }
        while(data.length > 0) {
            const colon = data.indexOf(':'),
                  end = colon + 1 + Number(data.substring(0, colon));
            let text = data.substring(1 + colon, end), json;
            const type = Number(text.charAt(0));
            this._emit('raw', 'packet', text);
            text = text.substring(1);
            data = data.substring(end);
            switch(type) {
                // Connect
                case 0:
                    if(this._params.sid) {
                        this._emit('error', 'multipleConnect');
                        break;
                    }
                    try {
                        json = JSON.parse(text);
                    } catch(e) {
                        this._emit('error', 'json', 'connect', text, e);
                        this.retry();
                        return;
                    }
                    this._params.sid = json.sid;
                    this._interval = setInterval(
                        this.post.bind(this),
                        json.pingInterval
                    );
                    this._emit('connect', 'packet');
                    break;
                // Disconnect
                case 1:
                    this.close('disconnect');
                    return;
                // Ping
                case 2:
                    this._emit('ping');
                    this.post();
                    break;
                // Pong
                case 3:
                    this._emit('pong');
                    break;
                // Data
                case 4:
                    const msgType = Number(text.charAt(0));
                    this._emit('raw', 'data', text);
                    text = text.substring(1);
                    switch(msgType) {
                        // Connect
                        case 0:
                            this._emit('connect', 'data');
                            break;
                        // Disconnect
                        case 1:
                            this.close('disconnect');
                            return;
                        // Event
                        case 2:
                            try {
                                json = JSON.parse(text);
                            } catch(e) {
                                this._emit('error', 'json', 'event', text, e);
                            }
                            this._emit('event', json[1]);
                            break;
                        // Ack
                        case 3:
                            this._emit('unknown', 'ack');
                            break;
                        // Error
                        case 4:
                            this.close('error');
                            return;
                        // Binary event
                        case 5:
                            this._emit('unknown', 'event', 'binary');
                            break;
                        // Binary ack
                        case 6:
                            this._emit('unknown', 'ack', 'binary');
                            break;
                        // Unknown
                        default:
                            this._emit('unknown', 'type', 'data', msgType);
                            break;
                    }
                    break;
                    // Upgrade
                    case 5:
                        this.close('upgrade');
                        return;
                    // Noop
                    case 6:
                        this._emit('noop');
                        break;
                    // Unknown
                    default:
                        this._emit('unknown', 'type', 'packet', type);
                        break;
            }
        }
        setTimeout(this._poll.bind(this), 0);
    }
    /**
     * Handles received data after a POST request
     * @method _handlePost
     * @private
     * @param {String} data Data received from the server
     */
    _handlePost(data) {
        if(typeof data !== 'string' || data.trim().toLowerCase() !== 'ok') {
            this._emit('unknown', 'post', data);
        }
    }
    /**
     * Handles a socket HTTP error
     * @method _handleError
     * @private
     * @param {Error} error HTTP error that happened
     */
    _handleError(error) {
        console.log('HTTP ERROR: ', error);
    }
    /**
     * Retries socket connection
     * @method retry
     */
    retry() {
        // TODO: Move this to configuration
        if(++this._retries === 8) {
            this.close('drop');
            return;
        }
        delete this._params.sid;
        if(this._interval) {
            clearInterval(this._interval);
        }
        console.log('Retrying...');
        this._poll();
    }
    /**
     * Closes the socket connection
     * @method close
     * @param {String} reason Reason for closing the connection
     */
    close(reason) {
        if(this._interval) {
            clearInterval(this._interval);
        }
        delete this._params.sid;
        this._emit('close', reason);
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
     * @returns {Number} Chat server port
     */
    get port() {
        return this._port;
    }
    /**
     * Gets the chat key
     * @returns {String} Chat key
     */
    get key() {
        return this._key;
    }
    /**
     * Gets the room ID
     * @returns {String} Room ID
     */
    get id() {
        return this._id;
    }
    /**
     * Gets the session ID of the user
     * @returns {String} Session ID
     */
    get sid() {
        return this._params.sid;
    }
    /**
     * Gets the wiki ID
     * @returns {Number} Wiki ID
     */
    get wikiId() {
        return this._wikiId;
    }
    /**
     * Gets the HTTP client
     * @return {IO} The HTTP client
     */
    get io() {
        return this._io;
    }
}

module.exports = Socket;
