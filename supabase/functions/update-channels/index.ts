// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { findSingle } from "https://deno.land/std@0.168.0/collections/find_single.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'


console.log("Hello from updating channels!")

const HYPESHOT_API_ENDPOINT = 'https://www.hypeshot.io/api/getChannels';
const WARPCAST_CHANNELS_ENDPOINT = 'https://api.warpcast.com/v2/all-channels';

type ChannelType = {
  url: string;
  name: string;
  source: string;
  icon_url: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS' || req.method === 'GET') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    let newChannels: ChannelType[] = [];
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    console.log('user is:', user);

    const res = await fetch(HYPESHOT_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json();
    console.log('Total nr. of Hypeshot channels from API:', data.items.length);
    newChannels = newChannels.concat(data.items.map((channel: any) => ({
      url: channel.parent,
      name: channel.channel_name,
      icon_url: channel.token_metadata?.image && channel.token_metadata?.itemMediaType == 2 ? channel.token_metadata?.image : null,
      source: `${channel.username} on Hypeshot`,
    })));

    const resWarpcast = await (await fetch(WARPCAST_CHANNELS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })).json();
    const warpcastChannels = resWarpcast?.result?.channels || [];
    console.log('Total nr. of Warpcast channels from API:', warpcastChannels.length);
    
    newChannels = newChannels.concat(warpcastChannels.map((channel: any) => ({
      url: channel.url,
      name: channel.name,
      icon_url: channel.imageUrl,
      source: 'Warpcast',
    })));

    let existingChannels = [];
    let hasMoreChannels = false;
    console.log('fetching existing channels in DB');
    do {
      const start = existingChannels.length;
      const end = start + 999;
      const { data, error, count } = await supabaseClient
        .from('channel')
        .select('*', { count: 'exact' })
        .range(start, end);
      
      // console.log(`existing channels request (${start}, ${end}), got ${count} rows, error ${error}`);
      if (error) throw error;
      existingChannels = existingChannels.concat(data);
      hasMoreChannels = data.length > 0;
    } while (hasMoreChannels);
    console.log('existingChannels in DB:', existingChannels.length);

    let insertCount = 0;
    for (const newChannel of newChannels) {
      const hasExistingChannel = findSingle(existingChannels, (channel) => channel.url === newChannel.url);
      // const existingChannelData = await supabaseClient
      //   .from('channel')
      //   .select('*')
      //   .eq('url', newChannel.url)
      //   .then(({ data, error }) => {
      //     if (error) throw error
      //     console.log('checking for existing channel', newChannel.url, 'data', data, error)
      //     return data;
      //   })
      // const hasExistingChannel = existingChannelData.length > 0;
      if (!hasExistingChannel) {
        await supabaseClient
          .from('channel')
          .insert(newChannel)
          .then(({ error, data }) => {
            console.log('insert response - data', data, 'error', error);
            if (error) throw error
            insertCount++;
          })
      }
    }

    const message = `from ${newChannels.length} results, added or updated ${insertCount} new channels`;
    console.log(message);
    const returnData = {
      message,
    }

    return new Response(JSON.stringify(returnData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
      corsHeaders
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
      corsHeaders
    })
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/update-channels' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
