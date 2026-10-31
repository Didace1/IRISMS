# IRISMS — Intelligent Repair, Inventory and Sales Management System

An integrated business management system designed to improve repair operations, inventory control, and sales management, with AI-assisted inventory demand forecasting.

## Project Overview

IRISMS is a software solution designed to help electronics repair and sales businesses manage their daily operations through a centralized platform.

The system brings together repair task management, spare-parts inventory, sales operations, and reporting. It also incorporates an AI component that analyzes historical sales and stock information to support inventory planning and decision-making.

## Key Features

- **Inventory Management:** Manage products, stock levels, and inventory activities.
- **AI-Assisted Inventory Forecasting:** Analyze historical sales and stock data to estimate future demand and support restocking decisions.
- **Repair Management:** Create, assign, track, and manage repair tasks.
- **Spare Parts Management:** Manage spare parts and requests associated with repair activities.
- **Sales Management:** Record and manage sales transactions.
- **User and Role Management:** Support different operational roles and access permissions.
- **Notifications:** Provide notifications for relevant system activities.
- **Reporting:** Support business monitoring and operational decision-making.

## User Roles

The system supports the following roles:

- **Administrator:** Manages system users, permissions, and overall operations.
- **Inventory Manager:** Oversees stock and uses AI-assisted forecasting to support inventory decisions.
- **Sales Representative:** Handles sales operations.
- **Technician:** Receives and updates assigned repair tasks and spare-parts requests.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Redux, Tailwind CSS |
| Backend | Java, Spring Boot |
| Database | PostgreSQL |
| AI Service | Python, FastAPI |
| Machine Learning | Scikit-learn, Pandas, NumPy |
| Data Visualization | Recharts |
| Version Control | Git and GitHub |

## System Architecture

IRISMS is organized into three main components:

1. **Frontend:** Provides the user interface and communicates with the backend.
2. **Backend:** Handles business logic, authentication, user management, repair operations, inventory, and sales.
3. **AI Service:** Provides inventory demand forecasting through a separate Python-based service.

The backend uses PostgreSQL for persistent data storage.

## Project Structure

The repository contains the following main components:

```text
IRISMS/
├── smartfix/             # Backend and AI service
│   ├── AI_BACKEND/       # Python AI service
│   └── src/              # Java application source
│
├── smartfix-frontend/    # React frontend
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following development tools:

- Java Development Kit (JDK)
- Maven
- Node.js and npm
- PostgreSQL
- Python and pip

### 1. Clone the repository

```bash
git clone https://github.com/Didace1/IRISMS.git
cd IRISMS
```

### 2. Configure the database

Create a PostgreSQL database and configure the backend database connection using your local application configuration.

Do not commit database passwords, API keys, or other private credentials to GitHub.

### 3. Run the backend

Navigate to the backend project directory and start the Spring Boot application using Maven.

### 4. Run the frontend

Navigate to the frontend directory and install its dependencies:

```bash
cd smartfix-frontend
npm install
npm run dev
```

### 5. Run the AI service

Navigate to the AI backend directory, install its Python dependencies, configure the service, and start the FastAPI application.

Refer to the project configuration files for the exact environment variables and startup settings.

## Project Purpose

IRISMS demonstrates the application of full-stack software engineering and machine learning concepts to a practical business management problem.

Its objective is to improve operational organization, provide better visibility into inventory activities, and support more informed stock-management decisions.

## Developer

**Didace Ishimwe**

Software Engineering

- GitHub: [Didace1](https://github.com/Didace1)
- Project: [IRISMS Repository](https://github.com/Didace1/IRISMS)

---

*IRISMS — Intelligent Repair, Inventory and Sales Management System.*