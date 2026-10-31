-- GabinBite.pwt - Supabase bootstrap
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor) before
-- running `php artisan migrate` against the Supabase database.
--
-- The application lives in its own `gabinbite` schema so the bookkeeping
-- tables are not exposed through the Supabase Data API (PostgREST). Only the
-- `public` schema is exposed by default.

create schema if not exists gabinbite;

-- The Laravel connection authenticates as the `postgres` role.
grant usage, create on schema gabinbite to postgres;

-- Defense in depth: make sure the Data API roles cannot reach the schema even
-- if `gabinbite` is ever added to the exposed schemas list.
revoke all on schema gabinbite from anon, authenticated;

alter default privileges in schema gabinbite
    revoke all on tables from anon, authenticated;

alter default privileges in schema gabinbite
    revoke all on sequences from anon, authenticated;

alter default privileges in schema gabinbite
    revoke all on functions from anon, authenticated;

-- Sanity check.
select nspname as schema
from pg_namespace
where nspname = 'gabinbite';
