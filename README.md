# MERN ThinkBoard
📸 [Video Demo](https://youtu.be/diXLIoQoP9g)

MERN ThinkBoard is a note management application built with the MERN stack (MongoDB, Express, React, Node.js). It allows users to create, edit, search, filter, and manage notes, with additional features like reminders and file uploads.

## Features

### Core Features
- **Note Management**: Create, edit, view, and delete notes.
- **Rich Text Editing**: Support for headings, bold, code blocks, and more.
- **File Attachments**: Upload images, PDFs, and other documents.
- **Search & Tag System**: Quickly find notes by keywords or tags.
- **User Authentication & Authorization**: Secure registration/login, each user only sees their own notes.
- **Version History**: Automatically saves previous versions of notes, with rollback capability.
- **Sharing**: Generate shareable links for view-only access, similar to Google Docs.
- **Reminders & Notifications**: Set deadlines and get in-app reminder notifications.
- **Favorites & Priority**: Mark important notes for quick access.

### Backend Features
- **RESTful API** for notes, users, reminders, and file uploads.
- **JWT Authentication** for secure access.
- **Scheduled Tasks** with `node-cron` for reminder checks.
- **Error Handling**: File size limits, type validation, database error handling.
- **Security**: CORS config, rate limiting.

## Motivation and Learning Journey

This project began as a basic note-taking app built by following a YouTube tutorial.  
After finishing the MVP, I independently added several advanced features, including:

1. Search & tagging system  
2. User authentication & authorization  
3. Version history with rollback  
4. Rich text editor  
5. File attachments (images/PDFs)  
6. Shareable links (read-only mode)  
7. Reminder & notification system  

Through these additions, I gained experience in **system design, authentication, state management, and backend API design**, learning how to transform a guided demo into a fully-fledged application.

## Environment Variables

### Backend Environment Variables
Configure the following variables in `backend/.env`:
```env
MONGO_URI=<Your MongoDB connection string>
JWT_SECRET=<Your JWT secret>
EMAIL_HOST=<SMTP server address>
EMAIL_PORT=<SMTP port>
EMAIL_USER=<SMTP username>
EMAIL_PASS=<SMTP password>
FRONTEND_URL=<Frontend URL>
```

### Frontend Environment Variables
Configure the following variables in `frontend/.env`:
```env
VITE_API_URL=<Backend API URL>
```
## Installation and Running
### Prerequisites
- Node.js (recommended version >= 16)
- MongoDB database
### Install Dependencies
Run the following command in the project root directory:

```
npm run build
```
### Start Backend
Navigate to the backend directory and run:
```
npm start
```
### Start Frontend
Navigate to the frontend directory and run:
```
npm run dev
```
The frontend will run at `http://localhost:5173 `by default, and the backend will run at `http://localhost:3000`.

## API Endpoints
### User Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get the current user's profile
### Note Management
- `GET /api/notes` - Retrieve a list of notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Retrieve a single note
- `PUT /api/notes/:id`- Update a note
- `DELETE /api/notes/:id` - Delete a note
### Reminder Management
- `GET /api/reminders` - Retrieve a list of reminders
- `POST /api/reminders` - Create a new reminder
## Tech Stack
- **Frontend**: React, React Router, Tailwind CSS, Vite
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Other**: Lodash, Nodemailer, Node-cron
## Contributing
Contributions are welcome! Please submit issues and pull requests via GitHub Issues.
