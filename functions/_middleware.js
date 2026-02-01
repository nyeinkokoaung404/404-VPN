///////////////////////////////////////////////
// Copyright (C) t.me/nkka404
// Channel: https://t.me/premium_channel_404
///////////////////////////////////////////////

import { handleUpdate } from './handlers.js';

export async function onRequest({ request, env, waitUntil }) {
    if (request.method !== 'POST') {
        return new Response('Bot is alive!', { status: 200 });
    }

    try {
        const update = await request.json();
        waitUntil(handleUpdate(update, env));
        return new Response('OK', { status: 200 });
    } catch (e) {
        return new Response('Error', { status: 200 });
    }
}
