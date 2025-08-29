# Enterprise Resource Planning (ERP) System

A comprehensive ERP system built with Python Flask backend and React frontend, designed to manage various business operations including user management, leave requests, vehicle management, license tracking, and document archiving.

## 🚀 Features

- **User Management**: Registration, authentication, and user role management
- **Leave Management**: Submit and track employee leave requests
- **Vehicle Management**: Track and manage company vehicles
- **License Management**: Monitor and manage software licenses
- **Document Archiving**: Digital archiving system for important documents
- **Invoice Management**: Create and manage invoices
- **Task Management**: Todo list and task tracking
- **Notifications**: Real-time notifications for various events

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Built-in email notification system
- **OCR Capabilities**: For document processing
- **Task Scheduling**: Background job processing

### Frontend
- **Framework**: React with Vite
- **UI Components**: Material-UI
- **State Management**: React Context API
- **Styling**: CSS-in-JS with Material-UI

## 📋 Prerequisites

### Backend Requirements
```
Python 3.12+
MongoDB
Virtual Environment
```

### Frontend Requirements
```
Node.js
npm/yarn
```

## 🔧 Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (create .env file)
5. Run the server:
   ```bash
   python run.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend/erp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

### Backend Structure
```
Backend/
├── app/
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   ├── utils/         # Helper functions
│   └── config.py      # Configuration
├── requirements.txt
└── run.py            # Application entry point
```

### Frontend Structure
```
Frontend/erp/
├── src/
│   ├── components/   # React components
│   ├── assets/      # Static files
│   ├── App.jsx      # Main app component
│   └── main.jsx     # Entry point
└── package.json
```

## 🔐 Key Features Explained

### Authentication System
- JWT-based authentication
- Role-based access control
- Secure password hashing

### Document Management
- OCR capabilities for text extraction
- Secure file storage
- Version control for documents

### Notification System
- Real-time notifications
- Email notifications
- Custom notification preferences

### Task Management
- Task creation and assignment
- Due date tracking
- Priority management

## 📱 API Documentation

The backend provides RESTful APIs for:
- User Management (/api/users/*)
- Leave Management (/api/leave/*)
- Vehicle Management (/api/vehicles/*)
- License Management (/api/licenses/*)
- Document Management (/api/documents/*)
- Task Management (/api/todos/*)

## 🔄 Development Workflow

1. Create feature branch
2. Implement changes
3. Run tests
4. Create pull request
5. Code review
6. Merge to main

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✍️ Authors

- [louatizine](https://github.com/louatizine)
