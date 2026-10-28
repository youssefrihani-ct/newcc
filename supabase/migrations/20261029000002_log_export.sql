-- Exports and downloads are audited (spec 16, 17c): the list view reports what it exported.
create or replace function public.log_export(p_list text, p_rows integer, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.mfa_satisfied() then
    perform public.app_error('auth.not_allowed');
  end if;
  perform public.audit_write('export', left(p_list, 80), 'export',
    jsonb_build_object('rows', p_rows, 'details', coalesce(p_details, '{}'::jsonb)));
end $$;

grant execute on function public.log_export(text, integer, jsonb) to authenticated;
