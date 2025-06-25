# Firebase Realtime Database Schema for Chat System

This document defines the complete database structure for the Snapchat clone chat functionality using Firebase Realtime Database.

## Database Structure Overview

```
snapchat-clone-rtdb/
├── chats/
│   └── {chatId}/
│       ├── participants: string[]
│       ├── createdAt: ServerTimestamp
│       ├── updatedAt: ServerTimestamp
│       ├── lastMessage: LastMessageInfo | null
│       ├── lastMessageAt: ServerTimestamp | null
│       ├── unreadCount: { [userId]: number }
│       ├── isArchived: { [userId]: boolean }
│       ├── isMuted: { [userId]: boolean }
│       ├── conversationType: "direct"
│       ├── messages/
│       │   └── {messageId}/
│       │       ├── senderId: string
│       │       ├── recipientId: string
│       │       ├── content: string
│       │       ├── type: "text" | "image" | "system"
│       │       ├── timestamp: ServerTimestamp
│       │       ├── status: MessageStatus
│       │       ├── readAt: ServerTimestamp | null
│       │       ├── editedAt?: ServerTimestamp
│       │       ├── deletedAt?: ServerTimestamp
│       │       ├── width?: number (for images)
│       │       ├── height?: number (for images)
│       │       ├── fileSize?: number (for images)
│       │       └── thumbnailUrl?: string (for images)
│       └── typing/
│           └── {userId}/
│               ├── isTyping: boolean
│               └── timestamp: ServerTimestamp
├── userPresence/
│   └── {userId}/
│       ├── isOnline: boolean
│       ├── lastSeen: ServerTimestamp
│       └── status?: "available" | "busy" | "away" | "invisible"
└── userChats/
    └── {userId}/
        └── {chatId}/
            ├── lastReadMessageId?: string
            ├── lastReadTimestamp?: ServerTimestamp
            ├── isArchived: boolean
            ├── isMuted: boolean
            └── isPinned: boolean
```

## Detailed Schema Definitions

### 1. Chats Collection (`/chats/{chatId}`)

The main collection containing all chat conversations.

#### Chat ID Format

- **Direct Messages**: `{userId1}_{userId2}` (sorted alphabetically)
- Example: `user123_user456`

#### Chat Metadata

```json
{
  "participants": ["user123", "user456"],
  "createdAt": { ".sv": "timestamp" },
  "updatedAt": { ".sv": "timestamp" },
  "lastMessage": {
    "id": "msg_abc123",
    "type": "text",
    "content": "Hello there!",
    "senderId": "user123",
    "timestamp": { ".sv": "timestamp" }
  },
  "lastMessageAt": { ".sv": "timestamp" },
  "unreadCount": {
    "user123": 0,
    "user456": 2
  },
  "isArchived": {
    "user123": false,
    "user456": false
  },
  "isMuted": {
    "user123": false,
    "user456": false
  },
  "conversationType": "direct"
}
```

### 2. Messages Subcollection (`/chats/{chatId}/messages/{messageId}`)

Individual messages within a conversation.

#### Text Message

```json
{
  "senderId": "user123",
  "recipientId": "user456",
  "content": "Hello, how are you?",
  "type": "text",
  "timestamp": { ".sv": "timestamp" },
  "status": "sent",
  "readAt": null
}
```

#### Image Message

```json
{
  "senderId": "user123",
  "recipientId": "user456",
  "content": "https://storage.googleapis.com/snapchat-clone/images/abc123.jpg",
  "type": "image",
  "timestamp": { ".sv": "timestamp" },
  "status": "sent",
  "readAt": null,
  "width": 1080,
  "height": 1920,
  "fileSize": 524288,
  "thumbnailUrl": "https://storage.googleapis.com/snapchat-clone/thumbnails/abc123_thumb.jpg"
}
```

#### System Message

```json
{
  "senderId": "system",
  "recipientId": "user456",
  "content": "Chat created",
  "type": "system",
  "timestamp": { ".sv": "timestamp" },
  "status": "sent",
  "readAt": null,
  "systemType": "chat_created"
}
```

### 3. Typing Indicators (`/chats/{chatId}/typing/{userId}`)

Real-time typing indicators for active conversations.

```json
{
  "isTyping": true,
  "timestamp": { ".sv": "timestamp" }
}
```

### 4. User Presence (`/userPresence/{userId}`)

Online/offline status and last seen information.

```json
{
  "isOnline": true,
  "lastSeen": { ".sv": "timestamp" },
  "status": "available"
}
```

### 5. User Chat Settings (`/userChats/{userId}/{chatId}`)

Per-user settings for each conversation.

```json
{
  "lastReadMessageId": "msg_xyz789",
  "lastReadTimestamp": { ".sv": "timestamp" },
  "isArchived": false,
  "isMuted": false,
  "isPinned": true
}
```

## Data Types and Constraints

### Message Status Values

- `sending`: Message is being sent
- `sent`: Message sent successfully
- `delivered`: Message delivered to recipient's device
- `read`: Message has been read by recipient
- `failed`: Message failed to send

### Message Types

- `text`: Plain text message
- `image`: Image message with URL
- `system`: System-generated message

### User Status Values

- `available`: User is online and available
- `busy`: User is online but busy
- `away`: User is away from keyboard
- `invisible`: User appears offline

## Database Rules

The database uses the following security rules (defined in `database.rules.json`):

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "chats": {
      "$chatId": {
        ".read": "auth != null && (auth.uid == data.child('participants').child('0').val() || auth.uid == data.child('participants').child('1').val())",
        ".write": "auth != null && (auth.uid == data.child('participants').child('0').val() || auth.uid == data.child('participants').child('1').val())",
        "messages": {
          "$messageId": {
            ".write": "auth != null && auth.uid == newData.child('senderId').val()"
          }
        }
      }
    },
    "userPresence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "userChats": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

## Query Patterns

### Common Queries

#### Get Conversations for User

```javascript
// Subscribe to all conversations where user is a participant
const chatsRef = ref(database, 'chats');
const query = query(chatsRef, orderByChild('lastMessageAt'));
```

#### Get Messages for Conversation

```javascript
// Get last 50 messages for a chat
const messagesRef = ref(database, `chats/${chatId}/messages`);
const query = query(messagesRef, orderByChild('timestamp'), limitToLast(50));
```

#### Check User Presence

```javascript
// Subscribe to user's online status
const presenceRef = ref(database, `userPresence/${userId}`);
```

### Indexing Requirements

The following indexes are recommended for optimal performance:

```json
{
  "rules": {
    "chats": {
      ".indexOn": ["lastMessageAt", "updatedAt"]
    },
    "messages": {
      ".indexOn": ["timestamp"]
    },
    "userPresence": {
      ".indexOn": ["lastSeen"]
    }
  }
}
```

## Data Lifecycle

### Message Lifecycle

1. **Creation**: Message created with `sending` status
2. **Sent**: Status updated to `sent` when successfully written to database
3. **Delivered**: Status updated when recipient's app confirms receipt
4. **Read**: Status updated when recipient views message, `readAt` timestamp set

### Conversation Lifecycle

1. **Creation**: Chat created when first message is sent between users
2. **Updates**: `lastMessage` and `lastMessageAt` updated with each new message
3. **Archival**: Users can archive conversations (stored in `userChats`)
4. **Cleanup**: Old messages can be cleaned up based on retention policies

### Presence Lifecycle

1. **Online**: Set when user opens app or becomes active
2. **Offline**: Set when user closes app or becomes inactive
3. **Cleanup**: Presence data cleaned up after extended offline periods

## Performance Considerations

### Data Limits

- Maximum message length: 1,000 characters
- Maximum messages per conversation: 10,000
- Image file size limit: 5MB
- Supported image types: JPEG, PNG, WebP

### Optimization Strategies

1. **Pagination**: Load messages in batches of 50
2. **Lazy Loading**: Load conversation details only when accessed
3. **Cleanup**: Regularly clean up old typing indicators and presence data
4. **Caching**: Cache frequently accessed conversation metadata
5. **Compression**: Compress large text messages before storage

## Migration and Backup

### Schema Versioning

- Current schema version: 1.0
- Version tracking stored in `/metadata/schemaVersion`

### Backup Strategy

- Daily backups of all chat data
- Retention period: 30 days
- Export format: JSON with timestamp

### Data Migration

- All schema changes must be backward compatible
- Migration scripts stored in `/migrations/` directory
- Rollback procedures documented for each version
