///////////////////////////////////////////////
// Developer: 404 \ 2.0 🇲🇲
// Channel: https://t.me/premium_channel_404
///////////////////////////////////////////////

const ADMIN_IDS = [6998791194, 1273841502];

export async function handleUpdate(update, env) {
    if (!update.message) return;

    const { text, chat, from, reply_to_message } = update.message;
    const chatId = chat.id;
    const userId = from.id;
    const chatType = chat.type;

    const BOT_TOKEN = env.BOT_TOKEN;
    const API_URL = env.API_URL;

    if (chatType !== 'private' || !ADMIN_IDS.includes(userId)) return;

    const commandText = text ? text.split(' ')[0].toLowerCase() : "";
    const args = text ? text.split(/\s+/) : [];

    try {
        // --- /start Command ---
        if (commandText === '/start') {
            const welcomeMsg = `<b>👋 Welcome To The Admin Panel!</b>\n` +
                               `<b>━━━━━━━━━━━━━━━━</b>\n` +
                               `ဤ Bot သည် VPN User များ စီမံရန်နှင့် Config Update ရန် ဖြစ်ပါသည်။\n\n` +
                               `📌 <b>အသုံးပြုနိုင်သော Command များ:</b>\n` +
                               `/add - User အသစ်ထည့်ရန်\n` +
                               `/edit - သက်တမ်းပြင်ရန်\n` +
                               `/del - User ဖျက်ရန်\n` +
                               `/free - Free Config Update\n` +
                               `/vip - VIP Config Update\n` +
                               `/setmenu - Bot Menu ကို Update လုပ်ရန်`;
            return await sendToTelegram(chatId, welcomeMsg, BOT_TOKEN);
        }

        // --- Bot Menu Set လုပ်ရန် ---
        if (commandText === '/setmenu') {
            await setBotCommands(BOT_TOKEN);
            return await sendToTelegram(chatId, "✅ <b>Bot Menu Updated!</b>", BOT_TOKEN);
        }

        // --- User Management: /add ---
        if (commandText === '/add') {
            if (args.length !== 3) {
                return await sendToTelegram(chatId, "💡 <b>Usage:</b>\n<code>/add &lt;hwid&gt; &lt;days&gt;</code>\n\n<i>ဥပမာ: /add myhwid123 30</i>", BOT_TOKEN);
            }
            const res = await fetch(`${API_URL}?action=add&hwid=${args[1]}&exp=${args[2]}`);
            const data = await res.json();
            return await sendToTelegram(chatId, `<b>➕ Add User Result</b>\n\n<b>Status:</b> ${data.api_result?.status}\n<b>Message:</b> ${data.api_result?.message}`, BOT_TOKEN);
        }

        // --- User Management: /edit ---
        if (commandText === '/edit') {
            if (args.length !== 3) {
                return await sendToTelegram(chatId, "💡 <b>Usage:</b>\n<code>/edit &lt;hwid&gt; &lt;days&gt;</code>\n\n<i>ဥပမာ: /edit myhwid123 60</i>", BOT_TOKEN);
            }
            const res = await fetch(`${API_URL}?action=edit&hwid=${args[1]}&exp=${args[2]}`);
            const data = await res.json();
            return await sendToTelegram(chatId, `<b>📝 Edit User Result</b>\n\n<b>Status:</b> ${data.api_result?.status}\n<b>Message:</b> ${data.api_result?.message}`, BOT_TOKEN);
        }

        // --- User Management: /del ---
        if (commandText === '/del') {
            if (args.length !== 2) {
                return await sendToTelegram(chatId, "💡 <b>Usage:</b>\n<code>/del &lt;hwid&gt;</code>\n\n<i>ဥပမာ: /del myhwid123</i>", BOT_TOKEN);
            }
            const res = await fetch(`${API_URL}?action=delete&hwid=${args[1]}`);
            const data = await res.json();
            return await sendToTelegram(chatId, `<b>🗑️ Delete User Result</b>\n\n<b>Status:</b> ${data.api_result?.status}\n<b>Message:</b> ${data.api_result?.message}`, BOT_TOKEN);
        }

        // --- Config Update: /free / /vip ---
        if (commandText === '/free' || commandText === '/vip') {
            const status = (commandText === '/free') ? 'free' : 'vip';
            const targetFileName = (status === 'vip') ? 'config.mvgl' : 'config.json';
            let configContent = "";

            if (reply_to_message && reply_to_message.document) {
                configContent = await downloadTelegramFile(reply_to_message.document.file_id, BOT_TOKEN);
            } else if (reply_to_message && reply_to_message.text) {
                configContent = reply_to_message.text;
            } else if (args.length > 1) {
                configContent = args.slice(1).join(' ');
            }

            if (!configContent) {
                return await sendToTelegram(chatId, `⚠️ <i>ကျေးဇူးပြု၍ <b>${targetFileName}</b> အတွက် Config စာသားထည့်ပါ သို့မဟုတ် ဖိုင်/စာသားကို Reply ပြန်ပါ။</i>`, BOT_TOKEN);
            }

            const formData = new FormData();
            formData.append('config_data', configContent);

            const res = await fetch(`${API_URL}?action=update_config&status=${status}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            const response = `<b>🚀 Config Updated (${status.toUpperCase()})</b>\n\n` +
                             `<b>Status:</b> ${data.api_result?.status || 'Success'}\n` +
                             `<b>Server File:</b> <code>${targetFileName}</code>`;
            
            return await sendToTelegram(chatId, response, BOT_TOKEN);
        }

    } catch (e) {
        await sendToTelegram(chatId, `<b>❌ System Error:</b> <code>${e.message}</code>`, BOT_TOKEN);
    }
}

async function setBotCommands(token) {
    const url = `https://api.telegram.org/bot${token}/setMyCommands`;
    const commands = [
        { command: "start", description: "Bot ကိုစတင်ရန်" },
        { command: "add", description: "HWID နှင့် ရက်ပေါင်းထည့်ရန်" },
        { command: "edit", description: "သက်တမ်းပြင်ရန်" },
        { command: "del", description: "User ဖျက်ရန်" },
        { command: "free", description: "Free Config Update" },
        { command: "vip", description: "VIP Config Update" }
    ];
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commands }) });
}

async function downloadTelegramFile(fileId, token) {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const contentRes = await fetch(`https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`);
    return await contentRes.text();
}

async function sendToTelegram(chat_id, text, token) {
    const footer = `\n\n--- 👤 <b>Developer Info</b> ---\n` +
                    `<b>Dev:</b> 404 \\ 2.0 🇲🇲\n` +
                    `<b>Channel:</b> <a href="https://t.me/premium_channel_404">Join Here</a>`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chat_id, 
            text: text + footer, 
            parse_mode: "HTML",
            disable_web_page_preview: true 
        })
    });
}
