# Supabase Configuration Guide

To complete the Option B implementation, you must create a Supabase project and provide the URL/Key.

1. Go to [https://supabase.com/](https://supabase.com/) and create a new project.
2. Under "SQL Editor", run the following command to create the necessary table:

```sql
create table if not exists public.client_submissions (
  id uuid default gen_random_uuid() primary key,
  client_name text not null,
  process_area text not null,
  opportunities_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and add a policy to allow anyone to insert (since the client form is public)
alter table public.client_submissions enable row level security;
create policy "Allow public inserts" on public.client_submissions for insert with check (true);
create policy "Allow read access" on public.client_submissions for select using (true);
```

3. Go to "Project Settings > API", and copy your `Project URL` and `anon public key`.
4. In the root of our codebase (`C:\Users\pradi\Downloads\DVF-Framework`), create a `.env` file and put the vars like so:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
