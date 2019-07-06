/**
 * io.js
 * 
 * Module for HTTP communication
 * Based on WikiaActivityLogger's io.js
 */
'use strict';

/**
 * Importing modules
 */
const http = require('request-promise-native'),
      util = require('./util.js');

/**
 * Constants
 */
const USER_AGENT = 'wikia-chat v0.0.1 [mandatory socket.io sucks text]';

/**
 * A simple HTTP client
 * @class IO
 */
class IO {
    /**
     * Class constructor
     * @constructor
     * @param {Object} jar Cookie jar to initialize with
     */
    constructor(token) {
        this._jar = http.jar();
        if(token) {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 10);
            this._jar.setCookie(http.cookie(
                `access_token=${token}; Expires=${date.toGMTString()}; Domain=wikia.com; Path=/; HttpOnly; hostOnly=false;` // jshint ignore: line
            ), 'http://wikia.com');
        }
    }
    /**
     * Internal method for handling HTTP requests
     * @method _request
     * @private
     * @param {String} method If to use GET or POST
     * @param {String} url URL to send the HTTP request to
     * @param {Object} qs Query string parameters
     * @param {Function} transform How to transform the data when receieved
     * @param {String} body POST body
     * @returns {Promise} Promise on which to listen for response
     */
    _request(method, url, qs, body) {
        return http({
            headers: {
                'User-Agent': USER_AGENT
            },
            method: method,
            uri: url,
            json: true,
            jar: this._jar,
            qs: qs,
            body: body
        });
    }
    /**
     * Sends a socket.io request
     * @method socket
     * @param {String} url URL of the socket.io endpoint
     * @param {Object} qs Parameters for the socket.io request
     * @param {String} body POST body of the request
     * @returns {Promise} Promise on which to listen for response
     */
    socket(url, qs, body) {
        util.verifyArgs(arguments, ['string', 'object']);
        qs.t = Date.now();
        return http({
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'text/plain;charset=UTF-8',
                'Accept': '*/*',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            qs: qs,
            body: body,
            uri: url,
            method: body ? 'POST' : 'GET',
            jar: this._jar
        });
    }
    /**
     * Makes a GET request
     * @method get
     * @param {String} url URL to send the HTTP request to
     * @param {Object} qs Query string parameters
     * @returns {Promise} Promise on which to listen for response
     */
    get(url, qs) {
        return this._request('GET', url, qs);
    }
    /**
     * Makes a GET request
     * @method post
     * @param {String} url URL to send the HTTP request to
     * @param {Object} qs Query string parameters
     * @param {Object} body POST body
     * @return {Promise} Promise on which to listen for response
     */
    post(url, qs, body) {
        return this._request('POST', url, qs, body);
    }
    /**
     * Calls the MediaWiki API
     * @method api
     * @param {String} wiki Wiki to query
     * @param {String} action Action to use
     * @param {Object} options Additional query options
     * @param {String} method Method to use when communicating with the API.
     *                        Set to GET by default
     * @returns {Promise} Promise on which to listen for response
     */
    api(wiki, action, options, method) {
        util.verifyArgs(arguments, ['string', 'string']);
        options.action = action;
        options.format = 'json';
        return this._request(
            method || 'GET',
            util.wikiScript(wiki, 'api'),
            options
        );
    }
    /**
     * Calls the ChatAjax endpoint
     * @method ajax
     * @param {String} wiki Wiki to query
     * @param {String} action Action to execute
     * @param {Object} options Additional query options
     * @param {String} method HTTP method
     * @returns {Promise} Promise on which to listen for response
     */
    ajax(wiki, action, options, method) {
        util.verifyArgs(arguments, ['string', 'string']);
        return this._request(
            method || 'POST',
            util.wikiScript(wiki, 'index'),
            Object.assign({
                action: 'ajax',
                rs: 'ChatAjax',
                method: action
            }, options)
        );
    }
}

module.exports = IO;
