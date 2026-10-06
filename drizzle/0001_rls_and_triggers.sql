-- Helper: is the current JWT user an admin? (security definer: bypasses RLS on profiles)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
--> statement-breakpoint

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1), 'Apprenant')
  )
  on conflict (id) do nothing;
  return new;
end $$;
--> statement-breakpoint
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
--> statement-breakpoint

-- role / is_house are admin-managed: browser roles cannot change them.
create or replace function public.protect_profile_privileges() returns trigger
language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.is_house is distinct from old.is_house)
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'role and is_house are admin-managed' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end $$;
--> statement-breakpoint
create trigger profiles_protect_privileges before update on public.profiles
  for each row execute function public.protect_profile_privileges();
--> statement-breakpoint

alter table public.profiles enable row level security;
--> statement-breakpoint
alter table public.categories enable row level security;
--> statement-breakpoint
alter table public.courses enable row level security;
--> statement-breakpoint
alter table public.sections enable row level security;
--> statement-breakpoint
alter table public.lessons enable row level security;
--> statement-breakpoint
alter table public.enrollments enable row level security;
--> statement-breakpoint

-- Definer rights are intentional: the view exposes only these columns, and only for people with a published course.
create view public.public_profiles as
  select p.id, p.display_name, p.avatar_path, p.headline, p.bio
  from public.profiles p
  where exists (select 1 from public.courses c where c.instructor_id = p.id and c.status = 'published');
--> statement-breakpoint
revoke all on public.public_profiles from anon, authenticated;
--> statement-breakpoint
grant select on public.public_profiles to anon, authenticated;
--> statement-breakpoint

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
--> statement-breakpoint
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
--> statement-breakpoint

create policy categories_read on public.categories for select to anon, authenticated using (true);
--> statement-breakpoint
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
--> statement-breakpoint

-- Phase 1: the browser never writes courses/curriculum; the server writes through the DB owner role.
create policy courses_read on public.courses for select to anon, authenticated
  using (status = 'published' or instructor_id = auth.uid() or public.is_admin());
--> statement-breakpoint
create policy courses_admin on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
--> statement-breakpoint
create policy sections_read on public.sections for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id
    and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())));
--> statement-breakpoint
create policy lessons_read on public.lessons for select to anon, authenticated
  using (exists (select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = section_id and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())));
--> statement-breakpoint

-- No insert/update/delete policy: enrollments are only created server-side.
create policy enrollments_read on public.enrollments for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
    or public.is_admin());
--> statement-breakpoint

-- RLS filters rows, not columns: keep lesson content (body, mux_playback_id) away from browser roles.
-- Content is served server-side after an entitlement check.
revoke select on public.lessons from anon, authenticated;
--> statement-breakpoint
grant select (id, section_id, position, title, kind, is_preview, duration_seconds) on public.lessons to anon, authenticated;
