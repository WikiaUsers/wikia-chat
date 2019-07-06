# Socket
Handles connection between the chat server and the client.

## Properties
### host (`String`)
Chat server the chat room is on.

### port (`Number`)
Port of the chat server the chat room is using.

### key (`String`)
Chat key of the user.

### id (`Number`)
ID of the chat room.

### sid (`String`)
Session ID of the user.

### wikiId (`Number`)
ID of the wiki the socket is connecting to.

### io (`IO`)
HTTP client of the socket.

## Methods
### post(body)
Posts a message to the chat server.
#### Parameters
| Name   | Type     |                                         | Required |
| ------ | -------- | --------------------------------------- | -------- |
| `body` | `Object` | Data to post, posts a ping if undefined | No       |

### retry()
Retries socket connection.

### close(reason)
Closes the socket with a specified reason.
#### Parameters
| Name     | Type     | Description        | Required |
| -------- | -------- | ------------------ | -------- |
| `reason` | `String` | Reason for closing | No       |
