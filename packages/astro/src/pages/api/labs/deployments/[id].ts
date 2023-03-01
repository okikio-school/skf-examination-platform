import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../db/db';
import { alphaNumeric, deployLabs, emailUserName, getAuth, isInteger } from './_deployment';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const get: APIRoute = async (context) => {
  const { params, request } = context;
  console.log({ params })

  // This is needed if you're planning to invoke your function from a browser.
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabase(context);
    const data = await getAuth(supabase);

    const user = data.session?.user;
    const userId = `${emailUserName(user?.email)}-${user?.id}`;

    const IDValid = params.id !== undefined;
    const UserValid = userId !== undefined;

    if (!IDValid || !UserValid)
      throw new Error(!IDValid ? `Deployment ID isn't defined` : `User isn't defined. Are you logged in?`);
    
    const instanceId = Number(params.id);
    isInteger(instanceId);
    alphaNumeric(userId);

    const result = await deployLabs(supabase, instanceId, userId)

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}