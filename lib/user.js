/**
 * user.js
 * 
 * Module for the user model
 */
'use strict';

/**
 * Class representing a Wikia user
 * @class User
 */
class User {
    /**
     * Class constructor
     * @constructor
     * @param {Object} data User's data
     * @param {Boolean} mediawiki If the data was obtained through MediaWiki API
     */
    constructor(data, mediawiki) {
        if(data) {
            this[`set${mediawiki ? 'Userinfo' : 'ChatData'}`](data);
        }
    }
    /**
     * Sets chat information about the user
     * @method setChatData
     * @param {Object} data Chat information about the user
     */
    setChatData(data) {
        data = data.attrs;
        this._avatar = data.avatarSrc;
        this._name = data.name;
        this._isMod = data.isModerator;
        this._isStaff = data.isStaff;
        this._status = {
            state: data.statusState,
            message: data.statusMessage
        };
        this._edits = data.editCount;
        this._groups = data.groups;
        // TODO: Set getters
        if(data.since) {
            this._since = new Date(data.since[0] * 1000);
        }
        this._private = data.isPrivate;
        this._privateID = data.privateRoomId;
        this._active = data.active;
    }
    /**
     * Sets information about the user from MediaWiki API
     * @method setUserinfo
     * @param {Object} data Information from MediaWiki API
     */
    setUserinfo(data) {
        const d = data.userinfo;
        this._name = d.name;
        this._id = d.id;
        this._groups = d.groups;
        this._rights = d.rights;
        this._options = d.options;
        this._blockInfo = d.blockinfo;
        this._token = data.pages[-1].edittoken;
    }
    /**
     * Kicks a user from a room
     * @method kick
     * @param {Room} room Room to kick the user from
     * @returns {Boolean} If pre-kick checks passed
     */
    kick(room) {
        if(!room) {
            return false;
        }
        return room.kick(this);
    }
    /**
     * Bans a user from a room
     * @method ban
     * @param {Room} room Room to ban the user from
     * @param {String|Number} length Length of the ban
     * @param {String} reason Reason for the ban
     * @returns {Boolean} If pre-ban checks passed
     */
    ban(room, length, reason) {
        if(!room) {
            return false;
        }
        return room.ban(this, length, reason);
    }
    /**
     * Unbans the user from a room
     * @method unban
     * @param {Room} room Room to unban the user from
     * @param {String|Number} reason Reason for the unban
     * @returns {Boolean} If pre-unban checks passed
     */
    unban(room, reason) {
        if(!room) {
            return false;
        }
        return room.unban(this, reason);
    }
    /**
     * Gets user's username
     * @returns {String} User's username
     */
    get name() {
        return this._name;
    }
    /**
     * Gets user's ID
     * @returns {Number} User's ID
     */
    get id() {
        return this._id;
    }
    /**
     * Gets user's avatar
     * @returns {String} URL to user's avatar
     */
    get avatar() {
        return this._avatar;
    }
    /**
     * Gets user's user groups
     * @returns {Array<String>} User's groups
     */
    get groups() {
        return this._groups;
    }
    /**
     * Gets if user has moderator permissions in chat
     * @returns {Boolean} If user is a moderator
     */
    get isMod() {
        return this._isMod;
    }
    /**
     * Gets if user has Staff permissions in chat
     * @returns {Boolean} If user has Staff permissions in chat
     */
    get isStaff() {
        return this._isStaff;
    }
    /**
     * Gets if user can kick/ban
     * @returns {Boolean} If the user can kick/ban
     */
    get canKickBan() {
        return this._isMod || this._isStaff;
    }
    /**
     * Gets user's chat status
     * @returns {Object} User's chat status
     */
    get status() {
        return this._status;
    }
    /**
     * Gets user's edit count
     * @returns {Number} User's edit count
     */
    get edits() {
        return this._edits;
    }
    /**
     * Gets user's user rights
     * @returns {Array<String>} User's rights
     */
    get rights() {
        return this._rights;
    }
    /**
     * Gets user's preferences
     * @returns {Object} User preferences information
     */
    get options() {
        return this._options;
    }
    /**
     * Gets block information of the user
     * @returns {Object} Block information of the user
     */
    get blockInfo() {
        return this._blockInfo;
    }
    /**
     * Gets user's edit token
     * @returns {String} User's edit token
     */
    get token() {
        return this._token;
    }
}

module.exports = User;