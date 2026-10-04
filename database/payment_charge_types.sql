-- Ampliación aditiva: conserva pagos anteriores como mensualidades.
-- Una forma de pago antigua desconocida permanece NULL, nunca se inventa.
begin;
alter table public.monthly_payments
    add column if not exists charge_type text not null default 'monthly'
        check (charge_type in ('monthly', 'exam', 'seminar', 'uniform', 'other')),
    add column if not exists payment_method text
        check (payment_method in ('cash', 'transfer')),
    add column if not exists charge_detail text not null default ''
        check (length(charge_detail) <= 200);
notify pgrst, 'reload schema';
commit;
