create or replace function public.list_admin_managers()
returns table (id uuid, role text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.role, p.created_at
  from public.profiles p
  where public.is_admin_or_manager(auth.uid())
    and p.role in ('admin','manager')
  order by p.created_at desc
$$;
grant execute on function public.list_admin_managers() to authenticated;