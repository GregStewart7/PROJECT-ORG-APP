# Database Setup

This directory contains the database schema and setup instructions for TaskFlow.

## Schema Overview

The database consists of three main tables:

1. **projects** - Stores project information (name, due date, user ownership)
2. **tasks** - Stores tasks within projects (name, due date, priority, completion status)
3. **notes** - Stores notes associated with tasks (multi-line text content)

## Setup Instructions

### 1. Access Supabase Dashboard

1. Go to [supabase.com](https://supabase.com) and log in
2. Navigate to your project: **tydmubjwtoioutylauoy**
3. Go to the "SQL Editor" tab

### 2. Run the Schema Script

1. Open the `schema.sql` file in this directory
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute the script

### 3. Verify Setup

After running the script, you should see:

- Three tables: `projects`, `tasks`, `notes`
- Row Level Security (RLS) policies enabled
- Proper foreign key relationships
- Indexes for performance
- Triggers for automatic `updated_at` timestamps

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Integrated with Supabase Auth
- **Data Validation**: Check constraints on name lengths and priority values
- **Cascade Deletes**: Deleting a project removes all associated tasks and notes

## Database Schema Diagram

```
auth.users (managed by Supabase)
├── projects (user_id → auth.users.id)
    ├── tasks (project_id → projects.id)
        ├── notes (task_id → tasks.id)
```

## Next Steps

Once the schema is set up:

1. Verify the tables exist in the Supabase dashboard
2. Test the connection from the Next.js application
3. Implement CRUD operations in the application code

## Environment Variables Required

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
``` 