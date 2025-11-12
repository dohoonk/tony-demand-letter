# Getting Started Guide

Now that your environment variables are configured, follow these steps to run the Demand Letter Generator.

## Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Python 3.9+ (for AI service)
- npm or yarn

## Setup Steps

### 1. Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE demand_letters;

# Exit psql
\q
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Seed with sample data
npx prisma db seed
```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Install AI Service Dependencies

```bash
cd ../ai-service
pip install -r requirements.txt
```

## Running the Application

You'll need three terminal windows/tabs:

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

Backend will start on: **http://localhost:3000**

### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend will start on: **http://localhost:5173** (default Vite port)

### Terminal 3: AI Service (Local Development)

For local development, you can run the AI service as a FastAPI server:

```bash
cd ai-service
uvicorn lambda_handler:app --reload --port 8000
```

AI Service will start on: **http://localhost:8000**

**Note:** For production, this would be deployed as AWS Lambda functions.

## Verify Everything Works

1. **Open your browser** to http://localhost:5173
2. **Register a new account** (first user will be an admin)
3. **Create a document** to test the workflow
4. **Upload a PDF** and try fact extraction
5. **Create templates** for demand letters
6. **Generate a draft** and export to DOCX

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in backend/.env matches your PostgreSQL setup
- Ensure the database exists: `psql -U postgres -l`

### Backend Won't Start
- Check if port 3000 is already in use: `lsof -i :3000`
- Verify all dependencies are installed: `npm install`
- Check .env file exists and has all required variables

### Frontend Won't Start
- Check if port 5173 is already in use
- Verify VITE_API_URL in frontend/.env points to backend
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### AI Service Issues
- Verify ANTHROPIC_API_KEY is valid
- Check Python dependencies: `pip list`
- Test API key: `python -c "import anthropic; print('OK')"`

### AWS S3 Upload Issues
- Verify AWS credentials in backend/.env
- Ensure S3 bucket exists and IAM user has permissions
- Check bucket name matches AWS_S3_BUCKET_NAME

## API Endpoints

Once running, you can test the API:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document details
- `POST /api/documents/:id/pdfs` - Upload PDF

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template

### Fact Extraction & Draft Generation
- `POST /api/facts/extract/:pdfId` - Extract facts from PDF
- `PUT /api/facts/:id/approve` - Approve fact
- `PUT /api/facts/:id/reject` - Reject fact
- `POST /api/facts/generate-draft/:documentId` - Generate draft

### Export
- `GET /api/export/:documentId/docx` - Export document to DOCX

## Next Steps

1. **Customize Templates**: Create firm-specific templates with placeholders
2. **Test Workflow**: Upload sample PDFs and generate demand letters
3. **Configure AWS Lambda**: Deploy AI service to Lambda for production
4. **Setup Deployment**: Configure production environment (AWS, Azure, or GCP)
5. **Add Users**: Register team members and assign roles

## Production Deployment

For production deployment:
1. Update NODE_ENV to "production"
2. Use production database (RDS recommended)
3. Deploy backend to AWS ECS/EC2 or similar
4. Deploy frontend to S3 + CloudFront or Vercel
5. Deploy AI service to AWS Lambda
6. Setup environment variables in your hosting platform
7. Configure CORS for production domains
8. Enable HTTPS/SSL certificates

## Support

For issues or questions:
- Check the logs in each service
- Review the PRD documentation
- Verify all environment variables are set correctly
- Ensure all external services (DB, S3, Anthropic) are accessible

