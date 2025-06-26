# Remote Health Monitoring System - Graduation Project

A comprehensive full-stack remote health monitoring system designed for real-time patient monitoring, automated health alerts, and seamless communication between patients and healthcare providers.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **Git** (for version control)

## First-Time Setup

If you're using this application for the first time:

1. **Automated Setup**: Double-click the `setup.bat` file
2. Follow the instructions to install Python and Node.js if needed
3. Restart your computer after installation

## Starting the Application

Choose one of these easy ways to start the system:

**Option 1:** Double-click `RemoteHealthMonitor.bat` to start with visible terminal windows
- You'll see status messages
- The browser will open automatically after a few seconds
- You can close the launcher window, but backend and frontend will keep running

**Option 2:** Double-click `RemoteHealthMonitorSilent.bat` to start completely in the background
- No visible windows will appear
- The browser will open automatically after a few seconds
- Everything runs in the background

**Legacy Option:** Double-click the `run.bat` file (deprecated, use options above instead)

### Manual Setup (Advanced Users)

1. **Backend Setup**
   ```bash
   cd RemoteHealthBackend-main
   pip install -r requirements.txt
   
   # Initialize database
   python -c "from app.db.init_db import init_db; init_db()"
   
   # Create initial users (admin, doctor, patient)
   python create_basic_data.py
   
   # Start the backend server
   python -m app.main
   ```
   Backend will run on: `http://localhost:8000`

2. **Frontend Setup**
   ```bash
   cd remote-health-frontend
   npm install
   npm start
   ```
   Frontend will run on: `http://localhost:3000`

### Stopping the Application

When you're done using the application:

- Double-click `StopRemoteHealth.bat` to stop all servers cleanly
- This will terminate both backend and frontend processes

## 🏗️ System Architecture

### Backend (FastAPI + SQLAlchemy)
- **Framework**: FastAPI with async support
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT-based authentication
- **API Documentation**: Auto-generated OpenAPI/Swagger docs at `/docs`

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: React Context API
- **UI Components**: Radix UI components

## 📋 Features

### 👥 User Roles

#### 1. **Patient**
- View personal health dashboard with modern, intuitive UI
- Add vital signs (heart rate, blood pressure, temperature, oxygen saturation)
- View vital signs history and trends with interactive charts
- Receive personalized health alerts
- Live demo mode with simulated realistic data
- Secure messaging with healthcare providers

#### 2. **Doctor**
- View all assigned patients with enhanced patient overview cards
- Monitor patient vital signs and trends
- Review system-wide alerts with color-coded priority indicators
- Access health records activity charts
- Communicate with patients via secure messaging

#### 3. **Admin**
- System-wide monitoring and management
- User management capabilities
- Access to all system data and analytics

### 🔧 Core Functionality

#### Health Data Management
- **Vital Signs Tracking**: Heart rate, blood pressure, temperature, oxygen saturation
- **Real-time Monitoring**: Live data updates with visual indicators
- **Historical Data**: Comprehensive data history with trend analysis
- **Data Validation**: Input validation and normal range indicators

#### Interactive Dashboard
- **Modern UI**: Enhanced with gradients, animations, and hover effects
- **Live Demo Mode**: Simulated vital signs for testing and demonstrations (updates every 2 seconds)
- **Real Data Mode**: Actual patient data storage and retrieval
- **Responsive Charts**: Interactive time-series charts with Chart.js
- **Alert System**: Real-time health alerts and notifications with visual indicators

#### Communication
- **Secure Messaging**: Encrypted communication between patients and providers
- **Alert Notifications**: System-generated health alerts
- **Status Indicators**: Real-time system status and connectivity

## New Features

### Enhanced UI/UX
- **Modern Design**: Updated with gradients, rounded corners, and smooth animations
- **Interactive Elements**: Hover effects, scale animations, and visual feedback
- **Improved Cards**: Enhanced patient cards, alert cards, and summary cards
- **Better Icons**: Contextual icons with color-coded backgrounds
- **Status Indicators**: Real-time status indicators throughout the interface

### Fake Data Generator

This application now includes a built-in data simulator that generates realistic vital signs data for patients. This is perfect for testing, demos, or training scenarios.

#### Using the Data Generator:

1. Log in as a doctor or administrator
2. Click on "Data Simulator" in the sidebar
3. Use the simulator controls to:
   - Start/stop simulation
   - Quick-start with all available patients
   - Add specific patients to simulation
   - Configure data generation intervals
   - Apply simulation patterns (diurnal variation, exercise periods)

#### Features:

- Realistic vital signs within normal ranges
- Occasional anomalies to test alerting systems
- Pattern-based data generation (day/night cycles, activity periods)
- Patient-specific configuration options

#### API Access:

The simulator can also be controlled via API at `/api/v1/simulator` endpoints.

## Project Structure

- `remote-health-frontend/`: React TypeScript frontend application
- `RemoteHealthBackend-main/`: Python FastAPI backend application

## Requirements (Will be installed by setup.bat if needed)

- Node.js (v14 or later)
- Python (v3.8 or later)
- npm (comes with Node.js)

## Accessing the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

## Notes

- The first startup may take 5-10 minutes as it installs dependencies and compiles the React app
- Later startups will be much faster
- To stop the servers, close both command windows
- If you have trouble, try running `setup.bat` again

## Accessing the Application

### Standard Ports
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)

## Troubleshooting

If you see errors like "python is not recognized" or "npm is not recognized":
- Make sure you've installed both Python and Node.js
- Make sure you checked "Add to PATH" during installation 
- Try restarting your computer

If you have other issues:
- Try running `setup.bat` to verify your installation
- Try the manual setup instructions below

## Manual Setup (if needed)

### Frontend Setup

```bash
cd remote-health-frontend
npm install
npm start
```

### Backend Setup

```bash
cd RemoteHealthBackend-main
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

## Features

- User authentication (patients, doctors, admin)
- Health data tracking and visualization
- Remote patient monitoring
- Alerts and notifications
- Messaging between patients and healthcare providers

## 🗄️ Database Schema

### Core Tables
- **users**: User authentication and profile information
- **patient_profiles**: Extended patient information
- **vitals**: Vital signs measurements
- **alerts**: Health alerts and notifications
- **messages**: Secure communication between users

### Sample Data
The system includes sample users:
- **Admin**: `admin@example.com` / `admin123`
- **Doctor**: `doctor@example.com` / `doctor123`
- **Patient**: `patient@example.com` / `patient123`

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user info

### Patient Records
- `GET /api/v1/patient-records/` - Get all patient records
- `POST /api/v1/patient-records/` - Create new record
- `GET /api/v1/patient-records/{id}` - Get specific record
- `PUT /api/v1/patient-records/{id}` - Update record
- `DELETE /api/v1/patient-records/{id}` - Delete record

### Vital Signs
- `GET /api/v1/patient-records/vital-signs/{patient_id}` - Get patient vitals
- `POST /api/v1/patient-records/vital-signs/{patient_id}` - Add vital signs
- `GET /api/v1/patient-records/vital-signs/stats` - Get vital signs statistics

### Alerts
- `GET /api/v1/alerts/` - Get all alerts
- `POST /api/v1/alerts/` - Create new alert
- `GET /api/v1/alerts/patient/{patient_id}` - Get patient-specific alerts

### Messaging
- `GET /api/v1/messaging/partners` - Get chat partners
- `GET /api/v1/messaging/messages/{partner_id}` - Get conversation
- `POST /api/v1/messaging/messages/{partner_id}` - Send message

## 🛠️ Development

### Running in Development Mode

#### Backend Development
```bash
cd RemoteHealthBackend-main
python -m app.main --reload
```

#### Frontend Development
```bash
cd remote-health-frontend
npm start
```

### Building for Production

#### Frontend Build
```bash
cd remote-health-frontend
npm run build
```

#### Backend Deployment
```bash
cd RemoteHealthBackend-main
pip install -r requirements.txt
python -m app.main
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Frontend won't start**
- **Issue**: `npm start` fails
- **Solution**: 
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm start
  ```

#### 2. **Backend database errors**
- **Issue**: "no such table" errors
- **Solution**:
  ```bash
  # Delete existing database
  rm remote_health.db
  
  # Recreate database and tables
  python -c "from app.db.init_db import init_db; init_db()"
  python create_basic_data.py
  ```

#### 3. **API connection issues**
- **Issue**: Frontend can't connect to backend
- **Check**: 
  - Backend is running on port 8000
  - Frontend config points to correct API URL
  - No firewall blocking ports
- **Solution**: Verify `config.ts` has correct API_URL

#### 4. **Authentication problems**
- **Issue**: Login fails or tokens invalid
- **Solution**:
  ```bash
  # Clear browser storage
  # Restart both frontend and backend
  # Check user credentials in database
  ```

#### 5. **Missing dependencies**
- **Issue**: Import errors or missing modules
- **Frontend Solution**:
  ```bash
  npm install @radix-ui/react-tooltip react-loading-skeleton
  npm install chartjs-adapter-date-fns
  ```
- **Backend Solution**:
  ```bash
  pip install -r requirements.txt
  ```

#### 6. **Port Already in Use**
- **Issue**: "Port 8000 is already in use" or "Port 3000 is already in use"
- **Solution**:
  ```bash
  # Kill processes on Windows
  netstat -ano | findstr :8000
  taskkill /PID <process_id> /F
  
  # Or use the StopRemoteHealth.bat script
  ```

#### 7. **UI Components Not Loading**
- **Issue**: Broken UI or missing components
- **Solution**:
  ```bash
  cd remote-health-frontend
  npm install @radix-ui/react-tooltip react-loading-skeleton
  npm run build
  npm start
  ```

### Database Management

#### Reset Database
```bash
cd RemoteHealthBackend-main
rm remote_health.db
python -c "from app.db.init_db import init_db; init_db()"
python create_basic_data.py
```

#### Add New Users
```bash
python create_basic_data.py
```

#### Database Migrations (if needed)
```bash
alembic upgrade head
```

### Port Configuration
- **Backend**: Port 8000 (configurable in `app/main.py`)
- **Frontend**: Port 3000 (default React dev server)
- **API Base URL**: `http://localhost:8000/api/v1`

## 📊 Data Flow

### Patient Vital Signs Flow
1. Patient logs in and accesses dashboard
2. Patient can toggle between live demo and real data modes
3. In demo mode: Simulated data updates every 2 seconds
4. In real mode: Patient manually enters vital signs
5. Data is validated and stored in SQLite database
6. Charts and alerts update automatically
7. Healthcare providers can view patient data

### Alert System Flow
1. System monitors vital signs for abnormal values
2. Alerts generated when values exceed normal ranges
3. Patient-specific alerts shown in patient dashboard
4. System-wide alerts visible to doctors and admins
5. Real-time updates via API polling

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different access levels for different user types
- **Input Validation**: Server-side validation for all data inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Secure Communication**: HTTPS-ready configuration

## 🧪 Testing

### Test Users
Use these credentials for testing:
- **Admin**: `admin@example.com` / `admin123`
- **Doctor**: `doctor@example.com` / `doctor123`
- **Patient**: `patient@example.com` / `patient123`

### Test Scenarios
1. **Patient Flow**:
   - Login as patient
   - Toggle demo mode on/off
   - Add vital signs manually
   - View charts and alerts

2. **Doctor Flow**:
   - Login as doctor
   - View patient list
   - Monitor system alerts
   - Check health records activity

3. **Admin Flow**:
   - Login as admin
   - Access all system data
   - Monitor system-wide metrics

## 📈 Performance Optimization

### Frontend Optimizations
- React component memoization
- Lazy loading for charts
- Efficient state management
- Optimized bundle size

### Backend Optimizations
- Database query optimization
- Async/await patterns
- Connection pooling
- Caching strategies

## 🚀 Deployment

### Environment Variables
Create `.env` files for different environments:

#### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ENV=development
```

#### Backend `.env`
```env
DATABASE_URL=sqlite:///./remote_health.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Production Deployment
1. Build frontend: `npm run build`
2. Serve static files with nginx/apache
3. Run backend with gunicorn or uvicorn
4. Set up proper SSL certificates
5. Configure database connection for production

## 📞 Support

### Getting Help
- Check this README for common solutions
- Review API documentation at `/docs` when backend is running
- Check browser console for frontend errors
- Check backend logs for API errors

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full-stack implementation
- User role management
- Vital signs tracking
- Real-time dashboard
- Secure messaging
- Alert system
- Demo mode functionality
- Enhanced UI with modern design
- Comprehensive error handling
- Complete documentation

---

**Last Updated**: June 26, 2025
**System Status**: ✅ Fully Operational
