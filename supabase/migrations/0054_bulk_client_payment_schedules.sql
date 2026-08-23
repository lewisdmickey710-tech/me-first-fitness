-- Set payment schedule for the clients bulk-imported in 0049/0050.
-- Cindy is the only one on a monthly schedule; everyone else pays as
-- they go. Guarded so it never overwrites a schedule already set by hand.
update public.clients
  set payment_schedule = 'monthly'
  where lower(name) = lower('Cindy') and payment_schedule is null;

update public.clients
  set payment_schedule = 'pay_as_you_go'
  where payment_schedule is null
    and lower(name) in (
      lower('Kristal'), lower('Sandra'), lower('Marta'), lower('Melanie'),
      lower('KAT'), lower('Karla'), lower('Dottie'), lower('Georgia'),
      lower('Erica'), lower('Lauren'), lower('Hina'),
      lower('[Name needed] — Lauren''s mom')
    );
