# The Alternative - Fashion Stylist AI

A full-stack fashion styling application with wardrobe management, outfit building, image-based search, and Firebase-backed authentication.

## Features

- AI-assisted fashion recommendations
- Image analysis and image-based item search
- Personal wardrobe management
- Outfit builder and discovery flows
- Sustainability scoring for clothing items
- Firebase authentication with a protected API

## Current Architecture

### Frontend

- React 18 with TypeScript
- Vite 6 with `@vitejs/plugin-react-swc`
- Utility-class styling with Tailwind-generated CSS
- Radix UI primitives with a local shadcn-style component layer in `src/components/ui`
- Material UI and Emotion for shared theming utilities
- Animation via `motion/react` and `framer-motion`
- Axios for API access
- Firebase Web SDK for auth and analytics
- React Hook Form for form handling
- Recharts for charts and data visualization

### Backend

- Node.js with TypeScript
- Express API server
- MongoDB via Mongoose
- Firebase Admin SDK for token verification and user integration
- Multer for multipart uploads
- Sharp for image processing
- Cloudinary for image storage
- `dotenv`, `cors`, and `express-async-errors` for configuration and middleware

### AI and Search

- CLIP-style image embeddings using `@xenova/transformers`
- Semantic image similarity search over stored wardrobe/catalog items
- Sharp-based fallback feature extraction when transformer-based extraction fails

## Dependency Inventory

### Frontend dependencies

- React, React DOM
- TypeScript
- Vite
- Axios
- Firebase Web SDK usage in source
- Radix UI packages
- Material UI (`@mui/material`, `@mui/icons-material`)
- Emotion (`@emotion/react`, `@emotion/styled`)
- `motion` and `framer-motion`
- `react-hook-form`
- `recharts`
- `sonner`
- `embla-carousel-react`
- `lucide-react`
- `react-day-picker`
- `next-themes`
- `cmdk`
- `vaul`
- `class-variance-authority`, `clsx`, and `tailwind-merge`

### Backend dependencies

- Express
- Mongoose
- Firebase Admin SDK
- Cloudinary
- Multer
- Sharp
- `@xenova/transformers`
- `cors`
- `dotenv`
- `express-async-errors`
- `nodemon`
- `ts-node`

## Known Gaps and Inconsistencies

- The frontend imports the Firebase Web SDK, but `firebase` is not currently declared in the root `package.json`.
- Tailwind-generated CSS is present in `src/index.css`, but the Tailwind package and config are not currently declared in the root `package.json`.
- The codebase uses both `motion/react` and `framer-motion`; that may be intentional, but it is worth standardizing if only one animation runtime is needed.
- The repo contains both `src/components/shared-theme` and `src/theme/shared-theme`, which suggests duplicated theme utilities.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance
- Firebase project credentials
- Cloudinary credentials

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd server
npm install
```

### Run the frontend

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

### Run the backend

```bash
cd server
npm run dev
```

Backend default URL: `http://localhost:3001`

### Import 500 more catalog items

The importer auto-detects a nearby DeepFashion dataset folder and imports the next 500 images that are not already in MongoDB with:

```bash
cd server
npm run import-next-500-deepfashion
```

To point at a different dataset folder, run:

```bash
cd server
npm run import-deepfashion -- --limit=500 --nextBatch=true --datasetRoot=C:\path\to\deepfashion
```

### Build

```bash
npm run build
cd server
npm run build
```

## Project Structure

```text
src/                     Frontend React application
server/src/              Backend Express API
server/src/routes/       API route handlers
server/src/models/       Mongoose models
server/src/services/     Image search and backend services
src/components/          Feature and shared UI components
src/components/ui/       Reusable primitive UI components
src/hooks/               Frontend hooks
src/services/            Frontend API and Firebase integration
src/utils/               Shared frontend utilities
```

## License

Private
