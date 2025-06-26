# Remote Health Monitoring System - Backend API

A comprehensive FastAPI backend application for a remote health monitoring system. This system provides secure API endpoints for user authentication, patient management, vital signs monitoring, real-time alerts, messaging, and clinical oversight.

## 🚀 Features

- **User Management**: Multi-role authentication (Patient, Doctor, Admin)
- **Patient Profiles**: Comprehensive patient data management
- **Vital Signs Monitoring**: Real-time health metrics tracking
- **Smart Alerts**: Automated anomaly detection and alerting system
- **Messaging System**: Secure communication between patients and healthcare providers
- **Clinical Dashboard**: Statistical insights and monitoring tools
- **Doctor Notes**: Medical record keeping and annotations

## 🛠 Technology Stack

- **Backend Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens) with role-based access control
- **Database Migrations**: Alembic
- **Data Validation**: Pydantic v2
- **API Documentation**: OpenAPI/Swagger UI
- **Real-time Communication**: WebSocket support

## 📁 Project Structure

```
RemoteHealthBackend/
├── alembic/              # Database migrations (Alembic)
│   ├── versions/         # Migration files
│   └── env.py           # Alembic environment configuration
├── app/
│   ├── api/              # API routers and endpoints
│   │   └── api_v1/
│   │       ├── endpoints/  # Endpoint modules (auth, users, patient-records, etc.)
│   │       └── api.py      # Main API router
│   ├── core/             # Core configuration (settings, JWT security)
│   ├── crud/             # Database CRUD operations
│   ├── db/               # Database configuration and initialization
│   │   ├── base.py         # SQLAlchemy Base
│   │   ├── init_db.py      # Database initialization script
│   │   └── session.py      # Database session management
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas (request/response models)
│   ├── services/         # Business logic services
│   └── main.py           # FastAPI application entry point
├── tests/                # Test files
│   ├── test_admin_login.py      # Authentication testing
│   ├── test_db_seeding.py       # Database seeding tests
│   └── test_vital_signs_stats.py # API endpoint testing
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── alembic.ini          # Alembic configuration
├── requirements.txt     # Python dependencies
└── README.md           # This documentation
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+ (developed and tested with Python 3.12)
- PostgreSQL database server
- pip (Python package manager)
- Git (for version control)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd RemoteHealthBackend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   # Copy the example environment file
   copy .env.example .env  # Windows
   cp .env.example .env    # Linux/Mac
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/remote_health_db
   JWT_SECRET=your-super-secret-jwt-key-here
   FIRST_SUPERUSER=admin@example.com
   FIRST_SUPERUSER_PASSWORD=admin123
   BACKEND_CORS_ORIGINS='["http://localhost:3000", "http://127.0.0.1:3000"]'
   ```

5. **Set up Alembic and database**:
   
   **Understanding Alembic**:
   Alembic is a database migration tool for SQLAlchemy. It's already configured in this project via `alembic.ini`.
   
   **First-time Alembic setup** (if starting fresh):
   ```bash
   # If alembic folder doesn't exist, initialize it (usually not needed for this project)
   alembic init alembic
   
   # Create initial migration from your models (if no migrations exist)
   alembic revision --autogenerate -m "Initial migration"
   ```
   
   **Apply existing migrations**:
   ```bash
   # Run all pending migrations to create/update database tables
   alembic upgrade head
   
   # Check current migration status
   alembic current
   
   # View migration history
   alembic history --verbose
   ```
   
   **For future model changes**:
   ```bash
   # After modifying SQLAlchemy models, create a new migration
   alembic revision --autogenerate -m "Add new patient fields"
   
   # Apply the new migration
   alembic upgrade head
   
   # Rollback to previous migration if needed
   alembic downgrade -1
   ```

6. **Seed initial data**:
   ```bash
   # Creates admin user, sample patient, and test data
   python -m app.db.initial_data
   ```

7. **Start the development server**:
   ```bash
   # Basic server (localhost only)
   uvicorn app.main:app --reload --port 8000
   
   # Server accessible from network (recommended for development)
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Production-like server
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```
   
   **Access points**:
   - Local: `http://localhost:8000`
   - Network: `http://YOUR_IP:8000` (replace YOUR_IP with your machine's IP)
   - API Docs: `http://localhost:8000/docs`

## 📚 API Documentation & Testing

### Interactive Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs` - Interactive API testing interface
- **ReDoc**: `http://localhost:8000/redoc` - Clean API documentation
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json` - Raw OpenAPI specification

### Default Credentials

After running the initial data seeding, you can use these default accounts:

- **Admin/Doctor**: 
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: Doctor with superuser privileges

- **Sample Patient**: 
  - Email: `patient1@example.com`
  - Password: `patientpassword`
  - Role: Patient

### Testing the API

The project includes several test scripts to validate functionality:

1. **Authentication Test**:
   ```bash
   python test_admin_login.py
   ```

2. **Database Seeding Test**:
   ```bash
   python test_db_seeding.py
   ```

3. **Vital Signs Stats Test**:
   ```bash
   python test_vital_signs_stats.py
   ```

### API Authentication

All protected endpoints require JWT authentication:

1. **Login** to get an access token:
   ```bash
   POST /api/v1/auth/login
   Content-Type: application/x-www-form-urlencoded
   
   username=admin@example.com&password=admin123
   ```

2. **Use the token** in subsequent requests:
   ```bash
   Authorization: Bearer <your-access-token>
   ```

## 🔗 API Endpoints Overview

### Authentication (`/api/v1/auth`)

-   **POST `/login`**: User login and JWT token retrieval
-   **POST `/register`**: New user registration (creates PATIENT role by default)
-   **GET `/me`**: Get current user information

### Users (`/api/v1/users`)
-   **POST `/`**: Create new user (Doctor/Admin only)
-   **GET `/`**: List all users (Doctor/Admin only)
-   **GET `/{user_id}`**: Get specific user (Doctor/Admin only)
-   **PUT `/{user_id}`**: Update user (Doctor/Admin only)

### Patient Records (`/api/v1/patient-records`)

-   **GET `/me`**: Get patient's own profile
-   **POST `/me`**: Create patient profile
-   **PUT `/me`**: Update patient profile
-   **GET `/`**: List all patients with filtering (Doctor/Admin only)
-   **GET `/{patient_id}`**: Get specific patient profile (Doctor/Admin only)
-   **GET `/{patient_id}/vitals`**: List patient's vital signs
-   **POST `/{patient_id}/vitals`**: Add new vital signs
-   **GET `/vital-signs/stats`**: Get vital signs statistics (Doctor/Admin only)

### Alerts (`/api/v1/alerts`)

-   **GET `/`**: List all alerts with filtering and sorting (Doctor/Admin only)
-   **GET `/patient/{patient_id}`**: List alerts for specific patient
-   **PUT `/{alert_id}/resolve`**: Mark alert as resolved (Doctor/Admin only)

### Messaging (`/api/v1/messaging`)
-   **GET `/partners`**: List chat partners
-   **GET `/messages/{partner_id}`**: Get conversation with user
-   **POST `/messages`**: Send new message
-   **PATCH `/messages/{message_id}/read`**: Mark message as read

### Doctor Notes (`/api/v1/notes`)
- **GET `/{patient_id}`**: Get all notes for patient (Doctor/Admin only)
- **POST `/{patient_id}`**: Create new note for patient (Doctor/Admin only)

> 💡 **Tip**: For detailed parameter information and request/response schemas, visit the Swagger UI at `/docs` when the server is running.

## 🗄️ Database & Data Management

### Initial Data Setup

The system includes comprehensive database seeding capabilities:

```bash
# Run database migrations
alembic upgrade head

# Populate with initial data
python -m app.db.initial_data
```

**What gets created:**
- **Admin user**: Full system access with doctor privileges
- **Sample patient**: Demo patient account with profile
- **Sample vital signs**: Including anomalous readings that trigger alerts
- **Disease thresholds**: Predefined health parameter limits
- **Sample alerts**: Demonstration of the alerting system
- **Doctor notes**: Example clinical notes
- **Messages**: Sample patient-doctor communications

### Database Migrations

When you modify database models, create and apply migrations:

```bash
# Create a new migration
alembic revision -m "description of your changes"

# Apply migrations
alembic upgrade head

# Check migration history
alembic history

# Rollback to previous version
alembic downgrade -1
```

### Database Testing

Use the included test scripts to validate your database setup:

```bash
# Test database connectivity and seeding
python test_db_seeding.py

# Verify API authentication
python test_admin_login.py

# Test specific API endpoints
python test_vital_signs_stats.py
```

## 🗃️ Database Management with Alembic

### Alembic Quick Reference

**Check migration status**:
```bash
# Show current migration
alembic current

# Show migration history
alembic history --verbose

# Show pending migrations
alembic show head
```

**Creating migrations**:
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add user preferences table"

# Create empty migration file (manual changes)
alembic revision -m "Custom migration description"

# Generate migration with specific message
alembic revision --autogenerate -m "Update patient schema for new fields"
```

**Applying migrations**:
```bash
# Upgrade to latest migration
alembic upgrade head

# Upgrade to specific migration
alembic upgrade ae1027a6acf

# Upgrade one step forward
alembic upgrade +1

# Downgrade one step back
alembic downgrade -1

# Downgrade to specific migration
alembic downgrade ae1027a6acf

# Downgrade to base (empty database)
alembic downgrade base
```

**Troubleshooting**:
```bash
# If you get "target database is not up to date"
alembic stamp head

# Reset to specific migration without running SQL
alembic stamp ae1027a6acf

# Show SQL that would be executed (dry run)
alembic upgrade head --sql

# Show differences between database and models
alembic revision --autogenerate -m "Check differences" --dry-run
```

### Database Reset (Development Only)
```bash
# Complete database reset
alembic downgrade base
alembic upgrade head
python -m app.db.initial_data
```
## 🔐 Security & Access Control

### Authentication System
- **JWT-based authentication** with secure token handling
- **Role-based access control (RBAC)** with three user types:
  - **Patient**: Access to own health data and communication with doctors
  - **Doctor**: Access to patient data, can create notes, manage alerts
  - **Admin**: Full system access, user management capabilities

### Security Best Practices
- All sensitive configuration stored in `.env` file (never commit to version control)
- Password hashing using bcrypt
- JWT tokens with configurable expiration
- CORS protection for frontend integration
- Input validation using Pydantic schemas

### Environment Security
```env
# Required environment variables
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=secure-admin-password
BACKEND_CORS_ORIGINS='["http://localhost:3000"]'
```

> ⚠️ **Important**: Always use strong, unique values for `JWT_SECRET` and admin passwords in production.

## 🚀 Development & Deployment

### Development Workflow

1. **Start the development server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

2. **Run tests**:
   ```bash
   # Test authentication
   python test_admin_login.py
   
   # Test database operations
   python test_db_seeding.py
   
   # Test API endpoints
   python test_vital_signs_stats.py
   ```

3. **Check API documentation**:
   - Visit `http://localhost:8000/docs` for interactive testing
   - Visit `http://localhost:8000/redoc` for clean documentation

### Production Considerations

- Use a production WSGI server (e.g., Gunicorn with Uvicorn workers)
- Set up proper PostgreSQL database with backups
- Configure environment variables securely
- Set up monitoring and logging
- Use HTTPS with proper SSL certificates
- Configure proper CORS origins for your frontend domain

## 🤝 Contributing

We welcome contributions to the Remote Health Monitoring System! Here's how to get started:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/RemoteHealthBackend.git
   cd RemoteHealthBackend
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up development environment** (follow the Quick Start guide above)

### Making Changes

1. **Make your changes** following the existing code style
2. **Test your changes**:
   ```bash
   # Run the test scripts
   python test_admin_login.py
   python test_db_seeding.py
   python test_vital_signs_stats.py
   ```
3. **Create database migrations** if you modified models:
   ```bash
   alembic revision -m "Description of your changes"
   ```

### Submitting Changes

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: Brief description of your feature"
   ```
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Create a Pull Request** on GitHub with a clear description of your changes

### Code Style Guidelines

- Follow PEP 8 for Python code style
- Use descriptive variable and function names
- Add docstrings to new functions and classes
- Update the README if you add new features or change setup procedures

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or contributions:

1. **Check existing issues** on GitHub
2. **Create a new issue** with detailed information
3. **Review the API documentation** at `/docs` when the server is running
4. **Check the test files** for usage examples

---

**Built with ❤️ for better healthcare monitoring**