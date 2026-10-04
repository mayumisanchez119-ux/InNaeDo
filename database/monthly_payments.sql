-- Mensualidades: libro de pagos privado para los instructores activos.
begin;
create table if not exists public.monthly_payments (
    id uuid primary key,
    student_id text not null references public.students(id) on delete restrict,
    student_name text not null check (length(trim(student_name)) > 0),
    group_name text not null,
    fee_month date not null check (extract(day from fee_month) = 1),
    paid_on date not null,
    amount_cop numeric(12,0) not null check (amount_cop > 0),
    note text not null default '',
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now()
);
create index if not exists monthly_payments_month_student_idx
    on public.monthly_payments (fee_month, student_id);
create index if not exists monthly_payments_student_idx
    on public.monthly_payments (student_id);
create index if not exists monthly_payments_created_by_idx
    on public.monthly_payments (created_by);
alter table public.monthly_payments enable row level security;
revoke all on public.monthly_payments from anon, authenticated;
grant select, insert on public.monthly_payments to authenticated;
grant all on public.monthly_payments to service_role;
create policy monthly_payments_instructor_read
    on public.monthly_payments for select to authenticated
    using (exists (
        select 1 from public.instructors i
        where i.user_id = (select auth.uid()) and i.active
    ));
create policy monthly_payments_instructor_insert
    on public.monthly_payments for insert to authenticated
    with check (created_by = (select auth.uid()) and exists (
        select 1 from public.instructors i
        where i.user_id = (select auth.uid()) and i.active
    ));
notify pgrst, 'reload schema';
commit;
