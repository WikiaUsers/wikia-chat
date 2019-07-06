# IO
The HTTP client the library is using. This is mostly for internal use, but if the library user doesn't want to bother with using their own HTTP client and setting the appropriate cookies into it, they can use this one.

## Methods
### IO(token)
Class constructor.
#### Parameters
| Name    | Type     | Description         | Required |
| ------- | -------- | ------------------- | -------- |
| `token` | `String` | Access token cookie | No       |

### get(url, qs)
Sends a GET request.
#### Parameters
| Name  | Type     | Description                | Required |
| ----- | -------- | -------------------------- | -------- |
| `url` | `String` | URL to send the request to | Yes      |
| `qs`  | `Object` | Query string parameters    | No       |

### post(url, qs, body)
Sends a POST request.
#### Parameters
| Name   | Type     | Description                | Required |
| ------ | -------- | -------------------------- | -------- |
| `url`  | `String` | URL to send the request to | Yes      |
| `qs`   | `Object` | Query string parameters    | No       |
| `body` | `String` | POST body                  | No       |

### socket(url, qs, body)
Sends a request to the chat server.
#### Parameters
| Name   | Type     | Description             | Required |
| ------ | -------- | ----------------------- | -------- |
| `url`  | `String` | URL of the chat server  | Yes      |
| `qs`   | `Object` | Query string parameters | No       |
| `body` | `String` | POST body               | No       |

### api(wiki, action, options, method)
Queries the MediaWiki API for the specified wiki.
#### Parameters
| Name      | Type     | Description                           | Required |
| --------- | -------- | ------------------------------------- | -------- |
| `wiki`    | `String` | Subdomain of the wiki to query        | Yes      |
| `action`  | `String` | API action                            | Yes      |
| `options` | `Object` | API query parameters                  | No       |
| `method`  | `String` | HTTP method to use (`GET` by default) | No       |

### ajax(wiki, action, options, method)
Queries the [ChatAjax endpoint](https://github.com/Wikia/app/blob/dev/extensions/wikia/Chat2/ChatAjax.class.php) for the specified wiki.
#### Parameters
| Name      | Type     | Description                            | Required |
| --------- | -------- | -------------------------------------- | -------- |
| `wiki`    | `String` | Subdomain of the wiki to query         | Yes      |
| `action`  | `String` | Ajax action                            | Yes      |
| `options` | `Object` | Query parameters                       | No       |
| `method`  | `String` | HTTP method to use (`POST` by default) | No       |
