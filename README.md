# THC Members Only Club

A modern, production-ready events management platform built with Next.js 14, Prisma, NextAuth, Chakra UI, and AWS S3.

## Features

- **Authentication**: NextAuth with email/password and Google OAuth
- **Role-Based Access Control**: ADMIN, ORGANIZER, VIEWER roles
- **Event Management**: Full CRUD operations for events
- **Image Processing**: Automated image optimization with Sharp
- **AWS S3 Integration**: Cloud storage with multiple image variants
- **Responsive Design**: Modern UI built with Chakra UI
- **Type Safety**: Full TypeScript support with Zod validation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Chakra UI, React Hook Form
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Image Processing**: Sharp
- **Storage**: AWS S3
- **Styling**: Tailwind CSS (via Chakra UI)

## Quick Start

### 1. Environment Setup

Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Strong secret for NextAuth
- `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

Optional (recommended for production):

- Redis (used for rate limiting and caching automatically when set):
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - or `REDIS_URL` (non-serverless)

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo users
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Demo Accounts

The seed script creates two demo accounts:

- **Admin**: `admin@example.com` / `admin123!`
- **Organizer**: `organizer@example.com` / `organizer123!`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/             # Reusable components
├── lib/                   # Utility libraries
├── styles/                # Theme and styling
└── types/                 # TypeScript definitions
```

## API Endpoints

- `GET /api/events` - List events with filtering
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event
- `POST /api/upload` - Upload and process images
- `GET /api/me` - Get current user info

## Image Processing

The platform automatically processes uploaded images into multiple variants:
- **tiny**: 300px width
- **thumb**: 600px width  
- **card**: 1200px width
- **hero**: 2000px width

All variants are generated in WebP and JPEG formats for optimal browser compatibility.

### File Upload Limits
- **Maximum file size**: 10 MB per image file
- **Supported formats**: JPEG, PNG, WebP, AVIF, HEIC, HEIF
- **Rate limit**: 10 uploads per hour per user

## S3 Configuration

Ensure your S3 bucket has the correct CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","PUT","POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag","Content-Length","Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

## Production Deployment

1. Set production environment variables
2. Run `npm run build`
3. Deploy to your preferred hosting platform
4. Ensure database migrations are applied

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
