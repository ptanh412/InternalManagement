@echo off
echo Starting Admin Reset Process - Business Management Edition...
echo.
echo This script will:
echo 1. Delete all existing admin users from identity service
echo 2. Create COMPLETE company department structure:
echo    • Headquarters (Executive Leadership)
echo    • Information Technology (IT, Software, Network, Security)
echo    • Human Resources (HR, Recruitment, Payroll)
echo    • Finance (Accounting, Treasury, Audit)
echo    • Marketing (Digital, Content, Research)
echo    • Sales (Customer Acquisition)
echo    • Operations (Business Operations)
echo    • Legal (Compliance, Contracts)
echo    • Research ^& Development (Innovation)
echo    • Customer Service (Support)
echo    • Quality Assurance (Testing)
echo    • Procurement (Purchasing)
echo    • Training ^& Development (Learning)
echo    • Security (Safety, Protection)
echo    • Facilities Management (Building Services)
echo    • Business Development (Growth)
echo 3. Create specialized sub-departments under major departments
echo 4. Create admin user with DIRECTOR role and full permissions
echo.
echo WARNING: This will permanently delete existing admin accounts!
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    exit /b 1
)

echo.
echo Starting business management admin reset...

cd /d "D:\Downloads\bookteria\identity-service"

echo Running comprehensive admin reset with business attributes...
mvn spring-boot:run -Dspring-boot.run.profiles=admin-reset -Dmaven.test.skip=true

echo.
echo ============================================================
echo ADMIN RESET COMPLETED - BUSINESS MANAGEMENT READY
echo ============================================================
echo New Admin Credentials:
echo Username: admin
echo Email: admin@bookteria.com
echo Password: Admin@123456
echo Employee ID: EMP-ADMIN-001
echo Phone: +1-555-0100
echo.
echo Business Management Attributes:
echo Business Role: DIRECTOR (highest authority level)
echo Department: Headquarters
echo Permissions: ALL business operations enabled
echo.
echo The admin can now:
echo - Manage all departments and users
echo - Create organizational structure
echo - Assign business roles
echo - Oversee all projects and operations
echo - Access all business management features
echo ============================================================
echo.
pause
