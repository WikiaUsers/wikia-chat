# Message
Message object is a model for received chat messages.

## Properties
### user (`String`)
Username of the user that sent the message.

### text (`String`)
Text of the message.

### alert (`String`)
If the message is an inline alert. Can be set to one of the following:
- `otherbrowser`: If the inline alert is saying the user connected from another browser
- `cantkickmods`: If the inline alert is saying the user can't kick other moderators
- `unknown`: If the library doesn't recognize the inline alert as a known one

### time (`Date`)
Time of the message.
