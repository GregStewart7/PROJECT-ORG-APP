-- Personal Project Management Software Database Schema
-- This script creates the necessary tables and Row Level Security policies

-- Create projects table
create table if not exists public.projects (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null check (char_length(name) > 0 and char_length(name) <= 100),
    description text check (char_length(description) <= 500),
    due_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    name text not null check (char_length(name) > 0 and char_length(name) <= 100),
    due_date date,
    priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
    completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
create table if not exists public.notes (
    id uuid default gen_random_uuid() primary key,
    task_id uuid references public.tasks(id) on delete cascade not null,
    title text not null check (char_length(title) > 0 and char_length(title) <= 100) default 'Note',
    content text not null check (char_length(content) > 0 and char_length(content) <= 10000),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on all tables
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

-- Create RLS policies for projects table
create policy "Users can view their own projects" on public.projects
    for select using (auth.uid() = user_id);

create policy "Users can insert their own projects" on public.projects
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects" on public.projects
    for update using (auth.uid() = user_id);

create policy "Users can delete their own projects" on public.projects
    for delete using (auth.uid() = user_id);

-- Create RLS policies for tasks table
create policy "Users can view tasks from their projects" on public.tasks
    for select using (
        exists (
            select 1 from public.projects 
            where projects.id = tasks.project_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can insert tasks to their projects" on public.tasks
    for insert with check (
        exists (
            select 1 from public.projects 
            where projects.id = tasks.project_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can update tasks from their projects" on public.tasks
    for update using (
        exists (
            select 1 from public.projects 
            where projects.id = tasks.project_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can delete tasks from their projects" on public.tasks
    for delete using (
        exists (
            select 1 from public.projects 
            where projects.id = tasks.project_id 
            and projects.user_id = auth.uid()
        )
    );

-- Create RLS policies for notes table
create policy "Users can view notes from their tasks" on public.notes
    for select using (
        exists (
            select 1 from public.tasks 
            join public.projects on projects.id = tasks.project_id
            where tasks.id = notes.task_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can insert notes to their tasks" on public.notes
    for insert with check (
        exists (
            select 1 from public.tasks 
            join public.projects on projects.id = tasks.project_id
            where tasks.id = notes.task_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can update notes from their tasks" on public.notes
    for update using (
        exists (
            select 1 from public.tasks 
            join public.projects on projects.id = tasks.project_id
            where tasks.id = notes.task_id 
            and projects.user_id = auth.uid()
        )
    );

create policy "Users can delete notes from their tasks" on public.notes
    for delete using (
        exists (
            select 1 from public.tasks 
            join public.projects on projects.id = tasks.project_id
            where tasks.id = notes.task_id 
            and projects.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_due_date_idx on public.projects(due_date);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_priority_idx on public.tasks(priority);
create index if not exists notes_task_id_idx on public.notes(task_id);

-- Create functions to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at
create trigger handle_updated_at before update on public.projects
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tasks
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.notes
    for each row execute procedure public.handle_updated_at(); 