# Client
Main class for the chat client, handling all other rooms.

## Properties
### username (`String`)
Username of the user.

### token (`String`)
Login token of the user.

### blocked (`Array<String>`)
Users whose private messages are blocked.

### blockedBy (`Array<String>`)
Users who blocked client's private messages.

### rooms (`Object`)
Map of map domains to `Room` objects.

## Methods
### refreshBlocks()

### join(domain)

### leave

### getRoom

### block

### unblock

### kill

## Events
### init
Emitted after the client logs in and fetches private blocks.

### error
Emitted when an error happens.
#### Parameters
- `source` (`String`): Source of the error. Can be set to one of the following:
    - `login`: If the error occurred during login
    - `blocks`: If the error occurred while fetching private blocks
- `error` (`Error`): The actual error object

### join
Emitted when the client's `join` method is called.
#### Parameters
- `room` (`Room`): Room that is being joined

### leave
Emitted when the client's `leave` method is called.
#### Parameters
- `room` (`Room`): Room that is being left

### block
Emitted when a user's private messages are blocked.
#### Parameters
- `user` (`String`): Username of the user

### unblock
Emitted when a user's private messages are unblocked.
#### Parameters
- `user` (`String`): Username of the user
