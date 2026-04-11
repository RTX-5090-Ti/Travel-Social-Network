# Travel Social Network

Travel Social Network is a full-stack social platform for sharing travel journeys, inspiring other travelers, and interacting in real time through comments, notifications, and direct messaging.

The project is built as a product-style experience rather than a simple CRUD demo. Users can publish rich travel journeys, discover community content, follow other travelers, receive live notifications, and chat instantly with each other.

## Product Overview

Travel Social focuses on two core experiences:

- Share travel journeys with milestones, media, and privacy controls
- Explore, interact, and stay connected with other travelers in real time

Instead of only posting short status updates, the platform highlights structured travel storytelling:

- Journey title and intro
- Timeline milestones
- Media galleries
- Public or follower-based visibility

## Main Features

### Authentication and Account

- Register, login, logout
- Refresh-token based authentication with cookies
- Change password
- Deactivate account
- Delete account

### Feed and Discovery

- Community feed with infinite scroll
- `Trending` mode
  Based on trips from the last 7 days using:
  `trendScore = likesCount * 3 + commentsCount * 2`
- `Latest` mode
  Sorted by newest journeys first
- User search by name or email
- Suggested people to follow

### Travel Journey Sharing

- Create journey with:
  - title
  - intro/caption
  - milestones
  - media
  - privacy
- Edit and delete journeys
- Save and hide journeys
- Journey detail overlay with timeline and media preview

### Social Interaction

- Like journeys
- Comment on journeys
- Reply to comments
- Like comments
- Lazy-load replies
- Open notifications to jump directly to the related trip/comment

### Real-Time Features

- Socket.IO integration
- Real-time notifications:
  - follow
  - trip like
  - comment
  - reply
  - comment like
- Real-time direct messaging
- Read/unread message state
- Online / offline presence

### Notifications

- Notification bell with unread badge
- In-panel notification list
- Mark as read
- Mark all as read
- Delete selected notifications
- Delete all notifications
- Incremental loading for older notifications

### Chat

- Conversation inbox
- Floating chat bubble
- Real-time sending and receiving
- Read status: sent / seen
- Send text messages
- Send image messages
- Send GIF messages
- Emoji picker support

### UI / UX

- Light mode / dark mode / system mode
- Vietnamese / English foundation with `react-i18next`
- Responsive layouts for desktop, tablet, and mobile
- Mobile bottom navigation
- Right sidebar drawer for smaller screens

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
- Giphy SDK
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

## Project Structure

```text
Project-Travel-JSSN/
├─ client/          # React frontend
├─ server/          # Express backend
└─ README.md
```

## Installation

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

Create `.env` files for both `server` and `client`.

Typical server configuration includes:

- MongoDB connection string
- JWT secrets
- Cookie/auth settings
- Cloudinary credentials
- Client origin

Typical client configuration includes:

- API base URL
- Socket server URL if separated
- Giphy API key

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
```

### Client

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Demo Flow Suggestion

For presentation/demo, a smooth flow is:

1. Login / register
2. Open feed and switch between `Trending` and `Latest`
3. Search a user and open their profile
4. Create or show an existing journey
5. Like, comment, and reply
6. Show real-time notification update
7. Open chat and send a live message
8. Switch theme and language in settings

## Current Scope

This project is focused on:

- travel storytelling
- social interaction
- real-time communication
- polished product-style UI

Some ideas may still be extendable later, such as more advanced post types, richer privacy settings, or deeper recommendation systems.

## Author

Developed as a travel social network product/project using React, Express, MongoDB, and Socket.IO.
