-- Register daily cron job to invoke the send-booking-reminders Edge Function.
-- This uses pg_cron and pg_net to call the deployed Edge Function endpoint.

select cron.schedule(
  'send-booking-reminders',
  '0 0 * * *',
  $$
    select net.http_post(
      url := 'https://vgqqcafrkydpothcvtan.supabase.co/functions/v1/send-booking-reminders',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('time', now()),
      timeout_milliseconds := 10000
    );
  $$
);
