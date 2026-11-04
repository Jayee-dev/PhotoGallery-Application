# Photo Gallery Application — Integrated Group Project

This project combines the submitted Photo Gallery modules into one Create React App frontend and one Node.js/Express backend.

## Included modules

- User Registration and Login UI (adapted from the team's React module)
- Upload Photo and My Gallery (your React module)
- View, edit, delete and title search for photos
- Search Photos by name, tag and date (Flask search behaviour converted to React and Express)
- Album creation and management UI (added to cover the requested album flow; the uploaded Search ZIP only described an `album_id` relation, and the Admin ZIP contained sample album data rather than a separate album-management page)
- Update Profile UI
- Admin Dashboard UI (adapted from the team's Vite component to work inside Create React App)
- Express API routes for authentication, photos, albums, search, profile and admin summaries
- A shared MySQL schema at `database/database.sql`

## Important implementation status

The merged frontend is a demonstration build. The frontend currently uses browser `localStorage` for demo login, photos, albums and profile information so that the screens can be explored without a running MySQL server. The Admin Dashboard also contains sample data from the submitted module.

The backend API and MySQL schema have been prepared separately. The current React screens are **not yet connected to those API endpoints**. To make the data permanent and suitable for final use, complete the database setup and connect the frontend screens to the APIs. Do not describe the current browser demo storage as MySQL-backed functionality.

The demo login stores passwords in browser localStorage. Use dummy test credentials only. The Express authentication API uses bcrypt password hashes and JWT, but it must be connected to the React login/register forms before claiming secure authentication.

## Requirements

- Node.js 20 or later
- npm
- MySQL Server 8.x (for database-backed API features)
- MySQL Workbench (optional graphical database tool)

## Run the frontend demo

Open a terminal in `client`:

```bash
npm install
npm start
```

Open <http://localhost:3000>.

Create an account in the browser demo, then log in. The workspace includes Upload Photo, My Gallery, Search Photos, Albums and Update Profile. The Admin Dashboard is a sample-data interface for review purposes.

The browser demo stores photo data as data URLs in localStorage and limits each selected image to 1.5 MB to avoid filling browser storage. Large or many photos should be stored through the Multer backend instead.

## Set up the MySQL database

1. Start MySQL Server.
2. Open the file `database/database.sql` in MySQL Workbench or another MySQL SQL client.
3. Execute the complete script.
4. Create a copy of `server/.env.example` named `server/.env`.
5. Set your own local MySQL username, password and a long random JWT secret in `server/.env`.

Example `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=photo_gallery_db
JWT_SECRET=use_a_long_random_secret_here
```

Never commit `server/.env` to GitHub.

## Run the Express backend

Open a second terminal in `server`:

```bash
npm install
npm start
```

The API base URL is <http://localhost:5000>.

Health check:

```text
GET http://localhost:5000/
```

Database check:

```text
GET http://localhost:5000/api/test-db
```

The database check will fail until MySQL Server is running, the schema has been created and `server/.env` has correct credentials.

## API routes prepared

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user (bcrypt hash) |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user's profile |
| GET | `/api/photos` | List current user's photos |
| POST | `/api/photos/upload` | Upload one image with Multer and save metadata |
| GET | `/api/photos/:id` | Get one owned photo |
| PUT | `/api/photos/:id` | Update photo details |
| DELETE | `/api/photos/:id` | Delete owned photo and file |
| GET/POST | `/api/albums` | List/create albums |
| PUT/DELETE | `/api/albums/:id` | Update/delete an album |
| GET | `/api/search?mode=name&q=...` | Search by photo title |
| GET | `/api/search?mode=tag&q=...` | Search by comma-separated tags |
| GET | `/api/search?mode=date&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` | Search by upload date |
| PUT | `/api/users/profile` | Update current user's profile |
| GET | `/api/admin/summary` | Admin dashboard counts |
| GET | `/api/admin/users` | List users for admin |
| DELETE | `/api/admin/users/:id` | Delete a user (admin only) |
| GET | `/api/admin/photos` | List photos for admin |

Protected API endpoints require:

```text
Authorization: Bearer <JWT_TOKEN>
```

To grant admin role after registering an account through the backend, run this in MySQL after verifying the email:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

Do not let public registration choose the admin role.

## Notes about the module merge

- The Admin Dashboard was built in Vite. Its component, stylesheet and sample images were moved into the existing Create React App project; the Vite project is not used as a separate frontend.
- The Search module was supplied as Flask + SQLite templates. Its name/tag/date search behaviour was reimplemented as a React workspace screen and an Express + MySQL route. The Flask server is not part of this merged app.
- The submitted files did not contain a standalone Album Management page. A basic create/list/delete album UI and matching Express routes/schema were added to cover that requirement.
- All demo users, albums and sample photos in the front end are local sample data until API integration is completed.
