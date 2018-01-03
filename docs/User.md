# User
User object is a model for a chat user.

## Properties
### name (`String`)
Name of the user.

### id (`Number`)
ID of the user.

### avatar (`String`)
URL to the user's avatar.

### groups (`Array<String>`)
User groups of the user.

### isMod (`Boolean`)
If the user is a chat moderator.

### isAdmin (`Boolean`)
If the user is an administrator.

### isStaff (`Boolean`)
If the user is a Staff member.

### canKickBan (`Boolean`)
If the user can kick/ban users from chat.

### status (`Object`)
Status of the user in chat. Keys of this object are:
- `state`: User's status state name
- `message`: User's status state message

### edits (`Number`)
Number of the user's edits.

### rights (`Array<String>`)
Array of user's rights.

### options (`Object`)
Preferences information of the user.

### blockInfo (`Object`)
Block information of the user.

### token (`String`)
User's edit token.

## Methods
### kick(room): Boolean
Kicks the user from a specified room. Returns `false` if the client isn't a moderator, the `room` parameter is invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name   | Type   | Description                | Required |
| ------ | ------ | -------------------------- | -------- |
| `room` | `Room` | Room to kick the user from | Yes      |

### ban(room, length, reason): Boolean
Bans the user from a specified room. Returns `false` if the client isn't a moderator, `room` or `length` parameters are invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name     | Type            | Description               | Required |
| -------- | --------------- | ------------------------- | -------- |
| `room`   | `Room`          | Room to ban the user from | Yes      |
| `length` | `Number|String` | Length of the ban         | Yes      |
| `reason` | `String`        | Reason for the ban        | No       |

### unban(room, reason)
Unbans the user from a specified room. Returns `false` if the client isn't a moderator, the `room` parameters is invalid or the room isn't connected, `true` otherwise.
#### Parameters
| Name     | Type     | Description               | Required |
| -------- | -------- | ------------------------- | -------- |
| `room`   | `Room`   | Room to ban the user from | Yes      |
| `reason` | `String` | Reason for the ban        | No       |

### block()

### unblock()
