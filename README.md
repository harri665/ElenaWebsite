# Elena — Artist Portfolio

Portfolio site for [@elena_artist_8](https://www.instagram.com/elena_artist_8/). A fixed full-screen WebGL
canvas sits behind every page and dissolves between artworks with an fbm-noise shader (modelled on the hero on
dungeonsanddragons.com) as you scroll, hover the gallery, or change pages.

## Admin — `/admin`

Add/edit/delete/reorder pieces, choose (or hide) the home page's featured section, write blog posts
(shown at `/blog`), list published works (shown at `/published`), and edit the About text.

- Password: the server's `ADMIN_PASSWORD` env var. In development it defaults to `admin`; in production the
  admin is disabled until it's set (for Docker, put `ADMIN_PASSWORD=...` in a `.env` next to `docker-compose.yml`).
- Content is stored in `server/data/site.json` and uploads in `server/data/uploads/` (both git-ignored; set
  `DATA_DIR` to move them). On first run `site.json` is created from the committed `server/data/seed.json`.
  **Back these up** — they are the site's content.
- The original Instagram images stay in `client/public/art/`.

## Code map

- **The transition itself:** `client/src/lib/backdrop/` (`shaders.js` = the effect, `renderer.js` = WebGL,
  `Backdrop.jsx` = which image shows when). Page fade-out/in lives in `client/src/lib/transition.jsx`.

Built on the Harrison default template below (React frontend, Express backend).

## Project Structure

```
HarrisonDefaultWeb/
├── client/          # React frontend (Vite + React 19)
├── server/          # Express backend
└── package.json     # Root package with concurrent scripts
```

## Tech Stack

### Frontend (Client)
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting

### Backend (Server)
- **Express 5** - Web framework
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-restart

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/harri665/HarrisonWebDefault.git
cd HarrisonDefaultWeb
```

2. Install dependencies for all packages:
```bash
npm install
npm run install:all
```

### Development

Start both client and server concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
npm run client    # Start frontend only
npm run server    # Start backend only
```

The client will typically run on `http://localhost:5173` and the server on `http://localhost:3001` (or ports configured in your setup).

To change port for client or servercreate a .env in the respective folder with: 
```env
PORT: #port number here 
```


## Available Scripts

### Root Level
- `npm run dev` - Run both client and server concurrently
- `npm run client` - Run client development server only
- `npm run server` - Run server development server only
- `npm run install:all` - Install dependencies in both client and server

### Client (`cd client`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server (`cd server`)
- `npm run dev` - Start server with nodemon (auto-restart)
- `npm start` - Start server in production mode


