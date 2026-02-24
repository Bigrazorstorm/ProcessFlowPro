# ProcessFlow Pro API Documentation

## Overview

ProcessFlow Pro is a comprehensive workflow management system designed for automating payroll and statutory deadline workflows. This API provides endpoints for managing users, clients, workflow templates, instances, execution tracking, and reporting.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.processflowpro.com/api`

## Interactive API Documentation

Once the server is running, interactive Swagger documentation is available at:
- **Local**: http://localhost:3000/api/docs
- **Production**: https://api.processflowpro.com/api/docs

## Authentication

All endpoints except `/auth/login` and `/auth/refresh` require authentication using JWT Bearer tokens.

### Getting Started

1. **Login** to obtain access and refresh tokens:
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "your-password"
   }
   ```

2. **Include the access token** in subsequent requests:
   ```
   Authorization: Bearer <your-access-token>
   ```

3. **Refresh your token** when it expires:
   ```bash
   POST /api/auth/refresh
   {
     "refreshToken": "<your-refresh-token>"
   }
   ```

## Multi-Tenancy

All API requests are tenant-isolated. The tenant context is extracted from the JWT token and automatically applied to all database queries.

## Role-Based Access Control

Users have one of the following roles with hierarchical permissions:
- **SUPER_ADMIN**: System-wide access
- **OWNER**: Full tenant access
- **SENIOR**: Management-level access
- **ACCOUNTANT**: Standard user access
- **TRAINEE**: Limited read access

## API Modules

### 1. Authentication (`/auth`)
Manage user authentication and tokens.

**Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile

### 2. Users (`/users`)
User management within a tenant.

**Endpoints:**
- `POST /users` - Create user (OWNER, SENIOR)
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user (OWNER, SENIOR)
- `DELETE /users/:id` - Delete user (OWNER)

### 3. Clients (`/clients`)
Client/customer management.

**Endpoints:**
- `POST /clients` - Create client (OWNER, SENIOR)
- `GET /clients` - List all clients
- `GET /clients/:id` - Get client by ID
- `PATCH /clients/:id` - Update client (OWNER, SENIOR)
- `DELETE /clients/:id` - Delete client (OWNER)

### 4. Workflow Templates (`/workflow-templates`)
Create and manage workflow templates with steps and deadline rules.

**Endpoints:**
- `POST /workflow-templates` - Create template (OWNER, SENIOR)
- `GET /workflow-templates` - List all templates
- `GET /workflow-templates/:id` - Get template by ID
- `PATCH /workflow-templates/:id` - Update template (OWNER, SENIOR)
- `DELETE /workflow-templates/:id` - Delete template (OWNER)
- `POST /workflow-templates/:id/steps` - Add step to template (OWNER, SENIOR)
- `PATCH /workflow-templates/:id/steps/:stepId` - Update template step (OWNER, SENIOR)
- `DELETE /workflow-templates/:id/steps/:stepId` - Delete template step (OWNER, SENIOR)

### 5. Workflow Instances (`/workflow-instances`)
Manage workflow instance lifecycle, created from templates for specific clients and periods.

**Endpoints:**
- `POST /workflow-instances` - Create instance from template (OWNER, SENIOR)
- `GET /workflow-instances` - List instances with filtering
- `GET /workflow-instances/:id` - Get instance details
- `GET /workflow-instances/:id/steps` - Get instance steps
- `POST /workflow-instances/monthly` - Trigger monthly instance creation (OWNER)
- `PATCH /workflow-instances/:id/steps/:stepId/status` - Update step status

### 6. Workflow Execution (`/workflow-execution`)
Execute and track workflow steps with time logging, approvals, and comments.

**Endpoints:**
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/start` - Start step
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/complete` - Complete step
- `PATCH /workflow-execution/instances/:instanceId/steps/:stepId/status` - Update status
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/assign` - Assign step (OWNER, SENIOR)
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/time` - Log time
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/comments` - Add comment
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/estimation` - Set estimation
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/approve` - Approve step (OWNER, SENIOR)
- `POST /workflow-execution/instances/:instanceId/steps/:stepId/reject` - Reject step (OWNER, SENIOR)
- `GET /workflow-execution/instances/:instanceId/progress` - Get overall progress

### 7. Dashboard (`/dashboard`)
High-level metrics and analytics.

**Endpoints:**
- `GET /dashboard` - Complete dashboard (OWNER, SENIOR)
- `GET /dashboard/metrics` - Overall metrics
- `GET /dashboard/workload` - User workload breakdown (OWNER, SENIOR)
- `GET /dashboard/clients` - Client progress (OWNER, SENIOR)
- `GET /dashboard/workflows` - Template metrics (OWNER, SENIOR)
- `GET /dashboard/activity` - Recent activity

### 8. Notifications (`/notifications`)
User notification management with preferences.

**Endpoints:**
- `GET /notifications` - List user notifications
- `GET /notifications/unread/count` - Count unread notifications
- `PATCH /notifications/:id/read` - Mark as read
- `POST /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/preferences` - Get user preferences
- `PATCH /notifications/preferences` - Update preferences
- `POST /notifications/clear-old` - Clear old notifications

### 9. Reporting (`/reports`)
Generate, export, and schedule analytics reports.

**Endpoints:**
- `POST /reports/generate` - Generate report (OWNER, SENIOR)
- `POST /reports/export` - Export report with format (OWNER, SENIOR)
- `GET /reports/types` - List available report types (OWNER, SENIOR)
- `POST /reports/schedule` - Schedule recurring report (OWNER)
- `GET /reports/schedules` - List scheduled reports (OWNER, SENIOR)
- `DELETE /reports/schedules/:scheduleId` - Cancel scheduled report (OWNER)
- `GET /reports/history` - Report history (OWNER, SENIOR)

**Report Types:**
- `WORKFLOW_SUMMARY` - Overall workflow metrics and bottlenecks
- `CLIENT_PERFORMANCE` - Client-level completion rates and delays
- `USER_WORKLOAD` - Per-user task distribution and utilization
- `TEMPLATE_ANALYTICS` - Template usage and performance
- `DEADLINE_COMPLIANCE` - Deadline adherence metrics
- `FINANCIAL_SUMMARY` - Transaction success rates by client

**Export Formats:**
- `json` - JSON format
- `csv` - CSV spreadsheet
- `pdf` - PDF document

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (for delete operations)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

*(To be implemented in production)*
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Pagination

List endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

Example:
```
GET /api/users?page=2&limit=25
```

## Filtering & Sorting

Many endpoints support filtering via query parameters:
- `GET /api/workflow-instances?status=active&clientId=<uuid>`
- `GET /api/users?role=ACCOUNTANT`

## Date Formats

All dates use ISO 8601 format:
- `2026-02-24T10:30:00Z` (datetime)
- `2026-02-24` (date only)

## Testing

Use the Swagger UI for interactive testing or use tools like Postman/Insomnia with the following base setup:

**Environment Variables:**
```
BASE_URL=http://localhost:3000/api
ACCESS_TOKEN=<your-jwt-token>
```

## Support

For API support or questions:
- Documentation: http://localhost:3000/api/docs
- GitHub Issues: https://github.com/processflowpro/backend/issues
- Email: support@processflowpro.com

## Changelog

### Version 1.0 (February 2026)
- Initial API release
- Core workflow management
- Dashboard and reporting
- Notification system
- Multi-tenant architecture
- Role-based access control
