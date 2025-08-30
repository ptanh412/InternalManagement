# Admin Reset System - Business Management Edition

This system provides a comprehensive admin account reset functionality that includes all the new business management attributes for your internal company system.

## What Gets Reset

### User Attributes
- **Username**: admin
- **Email**: admin@bookteria.com  
- **Password**: Admin@123456
- **Employee ID**: EMP-ADMIN-001
- **Phone**: +1-555-0100
- **Name**: System Administrator
- **Status**: Active, Email Verified

### Business Management Attributes
- **Business Role**: DIRECTOR (highest authority level)
- **Department**: Headquarters (auto-created if doesn't exist)
- **Permissions**: All business permissions (user management, department management, project oversight, etc.)
- **Authority Level**: Can manage all users, departments, and business operations

### System Roles
- **ADMIN**: Standard administrative role
- **BUSINESS_DIRECTOR**: Business management role with full permissions

## Reset Methods

### Method 1: Command Line (Recommended)
```bash
# Navigate to identity service
cd identity-service

# Run with admin-reset profile
mvn spring-boot:run -Dspring-boot.run.profiles=admin-reset -Dmaven.test.skip=true
```

### Method 2: Batch Script (Windows)
```bash
# Run the batch file
./reset-admin.bat
```

### Method 3: API Endpoint (Runtime)
```bash
# POST request to reset admin
POST /admin-reset/reset

# Check status
GET /admin-reset/status
```

## What Happens During Reset

1. **Cleanup Phase**
   - Deletes existing admin users
   - Removes old admin profiles
   - Cleans up orphaned data

2. **Department Setup**
   - Creates "Headquarters" department if it doesn't exist
   - Sets it as root department (no parent)
   - Configures as active department

3. **Admin Creation**
   - Creates new admin user with all attributes
   - Assigns DIRECTOR business role
   - Links to Headquarters department
   - Sets up full permissions

4. **Verification**
   - Confirms user creation
   - Validates business attributes
   - Logs all credentials

## Business Management Capabilities

The reset admin account will have:

### Full User Management
- Create, update, delete users
- Assign business roles and departments
- Manage user permissions
- Activate/deactivate accounts

### Department Administration
- Create hierarchical department structure
- Manage department assignments
- View organizational charts
- Control department access

### Business Operations
- Project management oversight
- Document approval workflows
- Company announcements
- System configuration
- Audit log access
- Payroll and HR functions

## Security Features

- **Encrypted Password**: Uses bcrypt hashing
- **Email Verification**: Pre-verified for immediate access
- **Role-based Access**: Proper RBAC implementation
- **Business Authorization**: Hierarchical authority system

## Post-Reset Actions

After reset, the admin can:

1. **Set up Organization Structure**
   - Create departments (IT, HR, Finance, etc.)
   - Define sub-departments
   - Assign department heads

2. **Configure Business Roles**
   - Assign users to appropriate business roles
   - Set up project teams
   - Define reporting structures

3. **Customize Permissions**
   - Fine-tune role permissions
   - Create custom business roles
   - Set up approval workflows

## Troubleshooting

### If Reset Fails
- Check database connectivity
- Ensure no active admin sessions
- Verify all required tables exist
- Check application logs

### If Business Attributes Missing
- Run the reset again
- Check BusinessDataInitializer executed
- Verify enum classes are properly loaded
- Confirm department creation succeeded

## Example Usage

```bash
# 1. Stop all services
docker-compose down

# 2. Start only database
docker-compose up -d mysql

# 3. Run admin reset
cd identity-service
mvn spring-boot:run -Dspring-boot.run.profiles=admin-reset

# 4. Start all services
cd ..
docker-compose up -d

# 5. Login with new credentials
Username: admin
Password: Admin@123456
```

## API Testing

After reset, test the admin capabilities:

```bash
# Login and get token
POST /auth/login
{
  "username": "admin", 
  "password": "Admin@123456"
}

# Test business management endpoints
GET /business/hierarchy
GET /departments
GET /business/roles
POST /departments (create new department)
```

The admin account is now ready for full business management operations!
