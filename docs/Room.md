# Room
Room object handles all events inside of a chat room.

## Properties
### id (`Number`)
Room ID.

### socket (`Socket`)
Chat socket instance of the room. The user does not need to touch this object, it's used mostly for passing it between parent and children rooms.

### user (`User`)
User in the room.

### wiki (`String`)
Domain of the chat room.

### parent (`Room`)
Parent chat room, `undefined` if the room isn't a PM room.

### users (`Object`)
Map of usernames to `User` objects in the room.

### userCount (`Number`)
Number of the users in the room

### privateUsers (`Array<String>`)
Array of usernames of users that are supposed to be in a private room. These users don't actually have to be in the private room. `undefined` if the room isn't a PM room.

### connected (`Boolean`)
If the room is connected and functioning.

### closeReason (`String`)
Reason for the room's closure. `undefined` if the room is still working.

### initialized (`Boolean`)
If the `initial` event has been received.

### privateRooms (`Object`)
Map of private room IDs to `Room` objects of the private rooms.

### server (`Object`)
Information about the server. Contains two keys:
- `hostname`: Server's host name
- `version`: Server's version

### io (`IO`)
HTTP client the room is using. Same HTTP client is passed to the socket as well.

## Methods
### Room(client, wiki, parent, id, users)
Class constructor.
#### Parameters
| Name     | Type            | Description                                                  | Required |
| -------- | --------------- | ------------------------------------------------------------ | -------- |
| `client` | `Client`        | Client controlling the room                                  | Yes      |
| `wiki`   | `String`        | Domain the room is connecting to                             | Yes      |
| `parent` | `Room`          | Parent room in case the room is private                      | No       |
| `id`     | `Number`        | ID of the room (automatically fetched for non-private rooms) | No       |
| `users`  | `Array<String>` | Users in the private room                                    | No       |

### command(name, args): Boolean
Sends a command to the chat server. Returns `false` if the command name was invalid or if the room isn't connected.
#### Parameters
| Name   | Type     | Description              | Required |
| ------ | -------- | ------------------------ | -------- |
| `name` | `String` | Command name             | Yes      |
| `args` | `Object` | Arguments to the command | No       |

### kick(user): Boolean
Kicks a user from the room. Returns `false` if the user isn't a moderator, the `user` parameter is invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name   | Type          | Description  | Required |
| ------ | ------------- | ------------ | -------- |
| `user` | `User|String` | User to kick | Yes      |

### ban(user, length, reason): Boolean
Bans a user from the room. Returns `false` if the user isn't a moderator, `user` or `length` parameter is invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name     | Type            | Description        | Required |
| -------- | --------------- | ------------------ | -------- |
| `user`   | `User|String`   | User to ban        | Yes      |
| `length` | `Number|String` | Length of the ban  | Yes      |
| `reason` | `String`        | Reason for the ban | No       |

### unban(user, reason): Boolean
Unbans a user from the room. Returns `false` if the user isn't a moderator, the `user` parameter is invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name     | Type          | Description          | Required |
| -------- | ------------- | -------------------- | -------- |
| `user`   | `User|String` | User to unban        | Yes      |
| `reason` | `String`      | Reason for the unban | No       |

### openPrivate(users, id): Boolean
Opens a private room with a user. Returns `false` if the `users` parameter is invalid, any of the users being PM'd blocked you or are blocked by you or the room isn't connected, `true` otherwise.
### Parameters
| Name    | Type                             | Description                           | Required |
| ------- | -------------------------------- | ------------------------------------- | -------- |
| `users` | `Array<String|User>|String|User` | User(s) with which to start a PM room | Yes      |
| `id`    | `Number`                         | ID of the private room                | No       |

### setStatus(state, message): Boolean
Sets the user's status. If `state` is set to "away", the user will be marked as away in vanilla chat. Returns `false` if the room isn't connected, `true` otherwise.
| Name      | Type     | Description       | Required |
| --------- | -------- | ----------------- | -------- |
| `state`   | `String` | Status state name | No       |
| `message` | `String` | Status message    | No       |

### send(text): Boolean
Sends a message to the chat and trims the message in the process. Returns `false` if the message isn't a string, exceeds the maximum message character limit (1000 at the moment of writing this documentation) or empty (after trimming) or if the room isn't connected, `true` otherwise.

### reconnect()
Closes and reopens the socket.

### kill()/leave()/part()
Leaves the room.

### killPrivate(room)
Deletes a private room from parent room's data. Called automatically on the parent room after killing a private room. If the private room being deleted isn't already killed, this kills it.

## Events
### connect
Emitted when the user connects to the room.
#### Parameters
- `source` (`String`): What is the connect event referring to. Can be set to one of the following:
    - `packet`: If it's referring to the event emitted when the chat server is sending the session ID to the client.
    - `data`: If it's referring to the event emitted when the chat server is telling the user the connection was successful and the client sends the `initquery` command in response.

### disconnect
Emitted when the user disconnects from the room.
#### Parameters
- `reason` (`String`): The reason for the user's disconnecting. Can be set to one of the following:
    - `disconnect`: When a disconnect event is sent from the chat server, most likely after a kick or a ban.
    - `error`: When the server sends an error event.
    - `upgrade`: When the server sends an upgrade event, most likely because the socket.io version the library is attempting to imitate is wrong. If this ever happens, contact the developer.
    - `drop`: When the connection is dropped after several attempts to reconnect. Most likely happens after internet connection is dropped.
    - `kill`: When the room is killed by the client (left).
    - `reconnect`: When the client is reconnecting.

### error
Emi#tted when something unexpected happens during the handling of socket events.
#### Parameters
- `source` (`String`): Source of the error. Can be one of the following:
    - `json`: If the error is related to unparsable JSON in an event. In case this happens, three more arguments are passed to the event, representing:
        - `source` (`String`): Where the parsing error occurred. Can be set to:
            - `data`: If the client figured the received data is initially JSON and not a socket.io packet but failed to parse it.
            - `connect`: If the error happened in the connect event.
            - `event`: If the JSON passed to a JSON event failed to parse.
        - `text` (`String`): The text that failed to parse.
        - `error` (`Error`): The error that was thrown during `JSON.parse`, can contain more useful information about where the exact parsing error occurred.
    - `multipleConnect`: If the client receives a connect event more than once after setting up a socket.
    - `dataFormat`: If the data that's passed to the socket internally somehow becomes a non-string. In case this happens, one more argument is passed to the event representing the invalid data.
    - `permission`: If the user doesn't have a `chat` permission.
    - `id`: If an error occurs during fetching of the wiki ID. Second parameter to the event is the HTTP error.
    - `domain`: If an error occurs during fetching of domain information from Nirvana. Second parameter to the event is the HTTP error.

### unknown
Emitted when an packet representing data that the client doesn't know how to handle is received.
#### Parameters
- `source` (`String`): Source of the unknown data. Can be one of the following:
    - `ack`: When the data is an ACK from the server. Wikia chat generally doesn't send this. If it's a binary ACK, "binary" will be passed as a second parameter to the event.
    - `event`: When the data is an unknown event. In case this happens, one or two more arguments are passed to the event:
        - `source` (`String`): Which event was unknown. Can be set to one of the following:
            - `binary`: If the event is a binary event which Wikia chat generally doesn't send.
            - `chat`: If an unknown chat event type is received. Second argument is the event type.
            - `socket`: If an unknown socket event type is received. Second argument is the event type.
    - `type`: When the data is an unknown event type. In case this happens, two more arguments are passed to the event, representing:
        - `source` (`String`): Which type was unknown. Can be set to one of the following:
            - `packet`: If a packet type was unknown.
            - `data`: If a data type was unknown (this means the packet type was 4).
        - `type` (`Number`): Type that was unknown.

### ping
Emitted when a ping is received from the server.

### pong
Emitted when a pong is received from the server.

### noop
Emitted when a noop is received from the server.

### raw
Contains raw packet/data.
#### Parameters
- `type` (`String`): Can be set to `packet`/`data` depending on which one is it representing.
- `data` (`String`): The raw packet/data.

### message
Emitted when a message is sent into the chatroom.
#### Parameters
- `msg` (`Message`): Message that was sent

### initial
Emitted when the server sends scrollback messages and current chat users to the client. 

### updateUser
Emitted when a user's status updates.
#### Parameters
- `user` (`User`): User whose status was updated

### join
Emitted when a user joins the chat.
#### Parameters
- `user` (`User`): User that joined the chat
- `rejoin` (`Boolean`): If the user was already in the userlist when the join event was received

### part
Emitted when a user leaves the chat.
#### Parameters
- `user` (`User`): User that left the chat
- `ghost` (`Boolean`): If the user wasn't in the userlist when the part event was received.

### logout
Emitted when a user sends a logout signal to the server, therefore leaving the chat
#### Parameters
- `user` (`User`): User that left the chat
- `ghost` (`Boolean`): If the user wasn't in the userlist when the logout event was received

### leave
Emitted when a user parts or logs out of chat.
#### Parameters
- `user` (`User`): User that left the chat
- `ghost` (`Boolean`): If the user wasn't in the userlist when the part/logout event was received

### kick
Emitted when a user gets kicked from chat.
#### Parameters
- `user` (`String`): Username of the kicked user
- `mod` (`String`): Username of the moderator that kicked the user

### ban
Emitted when a user gets banned from chat.
#### Parameters
- `user` (`String`): Username of the banned user
- `mod` (`String`): Username of the moderator that banned the user
- `length` (`Number`): Length of the ban

### unban
Emitted when a user gets unbanned from chat.
#### Parameters
- `user` (`String`): Username of the unbanned user
- `mod` (`String`): Username of the moderator that unbanned the user

### openPrivate
Emitted when an `openPrivateRoom` event is received.
#### Parameters
- `id` (`Number`): ID of the private room to open
- `users` (`Array<String>`): Array of usernames in the private room
- `success` (`Boolean`): Set to false if one of the users in the room is blocked or if the room is already joined.

### forceReconnect
Emitted when the server forces the client to reconnect, usually after joining through more than one client.
#### Parameters
- `data` (`Object`): Data for the event

### disableReconnect
Emitted when the server forces the client to disconnect and tells not to reconnect immediately. Usually after a kick or a ban.
#### Parameters
- `data` (`Object`): Data for the event

### longMessage
Emitted when a user attempts to send a too long message.
#### Parameters
- `user` (`String`): User that tried to send a message

### meta
Emitted when the server sends information about itself to the client.
- `data` (`Object`): Data object with two keys: `version` and `hostname`
