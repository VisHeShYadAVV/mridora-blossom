# Connecting the MRIDORA admin panel

1. Create a project at supabase.com.
2. In the SQL Editor, run the files in `migrations/`, oldest first.
3. Set these where the site is built, and in a local `.env` (see `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   Never use the `service_role` key here.
4. Under Authentication > Users, create your account, then make it the first super admin in the SQL Editor:
   ```sql
   insert into public.admin_users (user_id, email, role)
   select id, email, 'super_admin' from auth.users where email = 'you@example.com';
   ```
5. Turn off public sign-ups under Authentication > Sign In / Providers. Access still needs a role, but sign-ups are not needed.
6. Open `/admin`, sign in, set up two-factor authentication under Security, and press **Import starter catalogue**. The public catalogue is empty until you do. Pages show their default content until you publish them.

## Enquiry emails (optional but recommended)

Without this step, enquiries are saved and appear in the admin panel, but nobody is emailed.

1. Create a Resend account and verify the `mridoraglobal.com` domain.
2. Deploy `functions/notify-rfq` with `supabase functions deploy notify-rfq --no-verify-jwt`.
3. Set secrets `RESEND_API_KEY`, `WEBHOOK_SECRET` (any long random value), `EXPORT_EMAIL` and `FROM_EMAIL`.
4. Under Database > Webhooks, call the function on INSERT into `rfqs`, with header `x-webhook-secret` set to the same value.

Recipients and the buyer acknowledgement are set under Enquiries > Enquiry email settings.
