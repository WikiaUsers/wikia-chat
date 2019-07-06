/**
 * util.js
 * 
 * Module for minor utilities within the project
 */
'use strict';

/**
 * Importing modules
 */
const User = require('./user.js');

/**
 * Utility class.
 * WARNING: The functions fail LOUDLY
 * @class Util
 */
class Util {
    /**
     * Class constructor
     * @constructor
     * @throws {TypeError} When invoked
     */
    constructor() {
        throw new TypeError('This is a static class!');
    }
    /**
     * Iterates through elements of an object
     * @method each
     * @static
     * @param {Object} obj Object to iterate through
     * @param {Function} callback Callback function
     * @param {Object} context Context to bind the callback to
     */
    static each(obj, callback, context) {
        Util.verifyArgs(arguments, ['object', 'function', 'object']);
        for(let i in obj) {
            callback.call(context || this, i, obj[i]);
        }
    }
    /**
     * Determines the type of a variable
     * @method type
     * @static
     * @param {Object} obj Object to determine the type of
     * @returns {String} Type of the object
     */
    static type(obj) {
        const type = typeof obj;
        if(type === 'object') {
            if(type === null) {
                return 'null';
            } else if(obj instanceof Array) {
                return 'array';
            } else {
                return 'object';
            }
        } else {
            return type;
        }
    }
    /**
     * Verifies that arguments passed to a function are of
     * correct type
     * @method verifyArgs
     * @static
     * @param {Object} realArgs Real function arguments
     * @param {Array<String>} args Function argument types to verify
     * @throws {TypeError} If verification failed
     */
    static verifyArgs(realArgs, args) {
        if(Util.type(args) !== 'array' || Util.type(realArgs) !== 'object') {
            throw new TypeError('Incorrect parameters to Util.verifyArgs');
        }
        for(let i in realArgs) {
            if(
                Util.type(args[i]) === 'string' &&
                args[i].indexOf(Util.type(realArgs[i])) === -1
            ) {
                throw new TypeError('Unexpected arguments!');
            }
        }
    }
    /**
     * Returns a link to a wiki script
     * @method wikiScript
     * @static
     * @param {String} domain Wiki domain
     * @param {String} script Name of the wiki script
     * @returns {String} Link to the wiki
     */
    static wikiScript(domain, script) {
        return `http://${domain}.wikia.com/${script}.php`;
    }
    /**
     * Checks whether an array includes an object
     * @method includes
     * @static
     * @param {Array} arr Array to check
     * @param {*} obj Object to check for
     * @returns {Boolean} Whether the array includes the object
     */
    static includes(arr, obj) {
        Util.verifyArgs(arguments, ['array']);
        return arr.indexOf(obj) !== 0;
    }
    /**
     * Removes an element from an array
     * @method remove
     * @static
     * @param {Array} arr Array from which to remove an element
     * @param {*} obj Object to remove
     * @returns {*} Removed object
     */
    static remove(arr, obj) {
        Util.verifyArgs(arguments, ['array']);
        const index = arr.indexOf(obj);
        return index === -1 ? null : arr.splice(index, 1)[0];
    }
    /**
     * Normalizes a function name
     * @method func
     * @static
     * @param {Object} source Source object of the function
     * @param {String} prefix Prefix of the function
     * @param {String} name Name of the function
     * @returns {Function} Function with the normalized name
     */
    static func(source, prefix, name) {
        Util.verifyArgs(arguments, ['object', 'string', 'string']);
        return source[
            `${prefix}${name.charAt(0).toUpperCase()}${name.substring(1)}`
        ];
    }
    /**
     * Returns a user's name from a parameter that can be either
     * a user object or the user name
     * @method getUser
     * @param {String|User} user User whose username to get
     * @returns {String} User's username
     */
    static getUser(user) {
        if(typeof user === 'string') {
            return user;
        } else if(user instanceof User) {
            return user.name;
        } else {
            return null;
        }
    }
}

module.exports = Util;