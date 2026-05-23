GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_managers() TO authenticated;