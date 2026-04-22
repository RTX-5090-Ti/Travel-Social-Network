# Travel Social Network

Travel Social Network is a full-stack social platform for sharing travel journeys, discovering community stories, and interacting in real time through comments, notifications, and direct messaging.

The project was built with a product-oriented mindset instead of a simple CRUD demo. Users can publish structured travel journeys with milestones and media, explore public and follower-based content, receive live notifications, and chat instantly with other travelers.

## Product Highlights

- Structured travel storytelling with title, intro, milestones, and media
- Public / followers privacy for journeys
- Community feed with `Trending` and `Latest` modes
- Real-time notifications with Socket.IO
- Real-time direct messaging with read / seen state
- User search, follow system, save / hide journeys
- Light / dark / system theme support
- Vietnamese / English i18n foundation
- Responsive layouts for desktop, tablet, and mobile

## Main Features

### Authentication and Account

- Register, login, logout
- Refresh-token based authentication with HTTP-only cookies
- Bootstrap session on app load
- Change password
- Deactivate account
- Request account deletion
- Reactivate deactivated account

### Feed and Discovery

- Infinite scroll community feed
- `Trending` mode
  - prioritizes journeys from the last 7 days
  - trend score formula:
    `trendScore = reactionsCount + commentsCount * 2`
  - if recent trending data is not enough, the feed falls back to older latest journeys
- `Latest` mode
  - sorted by `createdAt` descending
  - tie-break by `_id`
- Cursor-based pagination
- Search users by name or email
- Suggested people to follow

### Travel Journey Sharing

- Create journeys with:
  - title
  - intro / caption
  - milestones
  - media
  - privacy
- Edit and delete journeys
- Save journeys
- Hide journeys temporarily
- Archive and trash flows
- Journey detail overlay with timeline and media preview

### Social Interaction

- Like journeys
- Comment on journeys
- Reply to comments
- Like comments
- Lazy-load replies
- Jump from notification directly to the related trip / comment

### Real-Time Features

- Socket.IO based realtime layer
- Real-time notifications:
  - follow
  - journey like
  - comment
  - reply
  - comment like
- Real-time direct messaging
- Presence tracking: online / offline / last seen
- Read receipts: sent / seen
- Socket reconnect with auth refresh handling

### Notifications

- Notification bell with unread badge
- Notification panel with incremental loading
- Mark as read when viewed
- Mark all as read
- Delete selected notifications
- Delete all notifications

### Chat

- Conversation inbox
- Floating chat bubble
- Real-time sending and receiving
- Open chat from inbox or mutual connections list
- Send:
  - text
  - emoji
  - image
  - GIF
- Image preview before sending
- Seen state updates in realtime

### UI / UX

- Light / dark / system mode
- Vietnamese / English foundation with `react-i18next`
- Mobile bottom navigation
- Sidebar drawer behavior on smaller screens
- Animated overlays, cards, and panels

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Router DOM 7
- Framer Motion
- Axios
- Socket.IO Client
- `emoji-picker-react`
- `@giphy/js-fetch-api`
- `@giphy/react-components`
- `i18next` + `react-i18next`

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- Joi validation
- JWT authentication
- Cookie-based auth flow
- Multer
- Cloudinary
- Socket.IO

## Architecture Notes

- Authentication uses short-lived access tokens and long-lived refresh tokens stored in HTTP-only cookies.
- Frontend bootstraps the session once on app startup and restores the logged-in user if the session is still valid.
- Realtime features share a single socket provider for notification, chat, and presence flows.
- Feed pagination uses cursors instead of page numbers.
- Comment replies are lazy-loaded to reduce initial payload size.
- Backend business logic has already started being moved from controllers into `services/`.

## Screenshots

Add product screenshots here before publishing or putting the project on your CV.

Suggested sections:

- Login page
- Feed page
- Journey detail overlay
- Notification panel
- Chat bubble / inbox
- Profile page
- Settings page

Example Markdown:

```md
## Screenshots

![Feed](./docs/screenshots/feed.png)
![Journey Detail](./docs/screenshots/journey-detail.png)
![Chat](./docs/screenshots/chat.png)
```

## Project Structure

```text
Project-Travel-JSSN/
|-- client/                 # React frontend
|-- server/                 # Express backend
|-- README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd File-5/Project-Travel-JSSN
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

## Environment Variables

Create `.env` files in both `server/` and `client/` based on the example files:

- [server/.env.example](./server/.env.example)
- [client/.env.example](./client/.env.example)

### Server `.env`

Typical values include:

- `PORT`
- `CLIENT_ORIGIN`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES`
- `REFRESH_TOKEN_EXPIRES`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Client `.env`

Typical values include:

- `VITE_API_URL`
- `VITE_GIPHY_API_KEY`

## Run the Project

### Start backend

```bash
cd server
npm run dev
```

### Start frontend

```bash
cd client
npm run dev
```

## Available Scripts

### Server

```bash
npm run dev
npm start
npm run lint
npm test
```

### Client

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Automated Tests

Backend currently includes a first automated test layer for core `auth` and `feed` logic.

Covered areas:

- auth helper logic
  - email normalization
  - refresh token hashing helper
  - auth payload shaping
  - deletion countdown label formatting
- feed helper logic
  - latest cursor encode / decode
  - trending cursor encode / decode
  - fallback trending cursor parsing
  - base feed filter building
  - latest cursor filter building

Run tests with:

```bash
cd server
npm test
```

## Demo Flow Suggestion

If you want to demo the product smoothly, this flow works well:

1. Register or log in
2. Show session restore by refreshing the app
3. Open feed and switch between `Trending` and `Latest`
4. Search a user and open their profile
5. Open a journey detail overlay
6. Like, comment, and reply
7. Trigger a realtime notification
8. Open chat and send a live message
9. Switch theme and language in settings

## Current Scope

This version focuses on:

- travel storytelling
- social interaction
- realtime communication
- polished UI / UX

Possible future extensions:

- richer post types beyond journeys
- stronger recommendation logic
- deeper privacy controls
- integration tests with database-backed API flows
- performance optimization through heavier code-splitting

## Repository Hygiene

The project already ignores:

- `node_modules`
- local `.env` files
- build output
- log files

See [.gitignore](./.gitignore) for details.

## Author

Developed as a full-stack product-style travel social network using React, Express, MongoDB, and Socket.IO.
