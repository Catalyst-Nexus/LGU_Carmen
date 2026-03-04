# Supabase RBAC Schema - Updated

## Table Structure

### roles
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **role_name** (text) - e.g., "User", "Admin"
- **role_code** (text) - e.g., "user", "admin"

### permissions
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **module_id** (uuid, FK to modules)
- **action_type** (text) - e.g., "view", "create", "edit", "delete"
- **permission_code** (text) - e.g., "module.view"
- **description** (text)

### role_permission
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **role_id** (uuid, FK to roles)
- **permission_id** (uuid, FK to permissions)

### user_roles
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **user_id** (uuid, FK to auth.users)
- **role_id** (uuid, FK to roles)

### modules
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **module_name** (text) - e.g., "User Management"
- **route_path** (text) - e.g., "/dashboard/users"
- **icons** (text) - icon name for sidebar
- **is_active** (boolean)

### facilities (optional)
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **facility_name** (text)

### user_facilities (optional)
- **id** (uuid, PRIMARY KEY)
- **created_at** (timestamp)
- **user_id** (uuid, FK to auth.users)
- **facilities_id** (uuid, FK to facilities)

## Access Flow

1. **Authentication**: User login via `auth.users` (Supabase Auth)
2. **Role Assignment**: Query `user_roles` to get user's roles
3. **Module Access**: 
   - Get role's permissions from `role_permission` table
   - Get permission details from `permissions` table
   - Check if permission's module_id is in allowed modules
4. **Sidebar**: Only display modules with granted permissions
5. **New User Registration**: Automatically assign 'user' role

## Updated Code Files

- **src/contexts/AuthContext.tsx** - Updated to fetch role from `user_roles` + `roles` tables
- **src/store/authStore.ts** - Updated login to fetch role from database
- **src/pages/Register/Register.tsx** - Auto-assign default 'user' role to new users
- **src/components/Sidebar/Sidebar.tsx** - Fetch modules using proper role-permission query chain

## Key Changes from Previous Approach

- Old: Role stored in user metadata
- New: Role stored in database via user_roles + roles tables
- Old: Simple role_permission check (role vs module)
- New: Chain check: user_roles → role_permission → permissions → modules
