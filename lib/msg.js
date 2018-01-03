/**
 * msg.js
 * 
 * Message model class
 */
'use strict';

/**
 * Constants
 */
const INLINE_ALERT = {
    'chat-err-connected-from-another-browser': 'otherbrowser',
    'chat-kick-cant-kick-moderator': 'cantkickmods',
    'chat-kick-you-need-permission': 'needpermission'
};

/**
 * Class representing a chat message
 * @class Message
 */
class Message {
    /**
     * Class constructor
     * @constructor
     * @param {Object} data Message chat data
     */
    constructor(data) {
        data = data.attrs;
        if(data.isInlineAlert) {
            this._alert = INLINE_ALERT[data.wfMsg] || 'unknown';
        } else {
            this._text = data.text;
            this._user = data.name;
            this._time = new Date(data.timeStamp);
            // TODO: Add getters
            this._id = data.id;
            this._roomId = data.roomId;
        }
    }
    /**
     * Gets the message sender
     * @returns {String} Message sender
     */
    get user() {
        return this._user;
    }
    /**
     * Returns the message contents
     * @returns {String} Message contents
     */
    get text() {
        return this._text;
    }
    /**
     * Returns the alert message
     * @returns {String} Alert message
     */
    get alert() {
        return this._alert;
    }
    /**
     * Returns when was the message sent
     * @returns {Date} Message time
     */
    get time() {
        return this._time;
    }
}

module.exports = Message;
