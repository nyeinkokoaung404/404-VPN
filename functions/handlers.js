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
        if (commandText === '/start') {
            const welcomeMsg = `<b>👋 Welcome Admin!</b>\n` +
                               `<b>━━━━━━━━━━━━━━━━</b>\n` +
                               `📌 <b>အသုံးပြုနိုင်သော Command များ:</b>\n` +
                               `/add - User အသစ်ထည့်ရန်\n` +
                               `/edit - သက်တမ်းပြင်ရန်\n` +
                               `/del - User ဖျက်ရန်\n` +
                               `/free - Free Config Update\n` +
                               `/vip - VIP Config Update\n` +
                               `/setmenu - Bot Menu Update လုပ်ရန်`;
            return await sendToTelegram(chatId, welcomeMsg, BOT_TOKEN);
        }

        if (commandText === '/setmenu') {
            await setBotCommands(BOT_TOKEN);
            return await sendToTelegram(chatId, "✅ <b>Bot Menu Updated!</b>", BOT_TOKEN);
        }

        // --- User Management Logic ---
        if (['/add', '/edit', '/del'].includes(commandText)) {
            // Usage Check
            if ((commandText === '/del' && args.length !== 2) || (['/add', '/edit'].includes(commandText) && args.length !== 3)) {
                const usage = commandText === '/del' ? `<code>${commandText} &lt;hwid&gt;</code>` : `<code>${commandText} &lt;hwid&gt; &lt;days&gt;</code>`;
                return await sendToTelegram(chatId, `💡 <b>Usage:</b>\n${usage}`, BOT_TOKEN);
            }

            // Loading Message ပြသခြင်း
            const loadingId = await sendLoading(chatId, BOT_TOKEN);
            
            let url = `${API_URL}?hwid=${args[1]}`;
            if (commandText === '/add') url += `&action=add&exp=${args[2]}`;
            if (commandText === '/edit') url += `&action=edit&exp=${args[2]}`;
            if (commandText === '/del') url += `&action=delete`;

            const res = await fetch(url);
            const data = await res.json();
            
            // Loading ကိုဖျက်ပြီး Result ပြခြင်း
            await deleteMessage(chatId, loadingId, BOT_TOKEN);
            const title = commandText === '/add' ? "➕ Add User" : commandText === '/edit' ? "📝 Edit User" : "🗑️ Delete User";
            return await sendToTelegram(chatId, `<b>${title} Result</b>\n\n<b>Status:</b> ${data.api_result?.status}\n<b>Message:</b> ${data.api_result?.message}`, BOT_TOKEN);
        }

        // --- Config Update Logic ---
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
                return await sendToTelegram(chatId, `⚠️ <i>ကျေးဇူးပြု၍ <b>${targetFileName}</b> အတွက် Config စာသားထည့်ပါ။</i>`, BOT_TOKEN);
            }

            const loadingId = await sendLoading(chatId, BOT_TOKEN);

            const formData = new FormData();
            formData.append('config_data', configContent);

            const res = await fetch(`${API_URL}?action=update_config&status=${status}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            await deleteMessage(chatId, loadingId, BOT_TOKEN);
            const response = `<b>🚀 Config Updated (${status.toUpperCase()})</b>\n\n` +
                             `<b>Status:</b> ${data.api_result?.status}\n` +
                             `<b>Message:</b> ${data.api_result?.message}`;
            
            return await sendToTelegram(chatId, response, BOT_TOKEN);
        }

    } catch (e) {
        await sendToTelegram(chatId, `<b>❌ System Error:</b> <code>${e.message}</code>`, BOT_TOKEN);
    }
}

// Loading Message ပို့သည့် Function
async function sendLoading(chatId, token) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: "⏳ <b>Loading... Please wait...</b>", parse_mode: "HTML" })
    });
    const data = await res.json();
    return data.result.message_id;
}

// Message ပြန်ဖျက်သည့် Function
async function deleteMessage(chatId, messageId, token) {
    await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId })
    });
}

function convertToHTML(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/^#{1,6}\s+(.*)$/gim, "<b>$1</b>")
        .replace(/^\s*[-*]\s+/gm, "• ");
}

async function sendToTelegram(chat_id, text, token) {
    // text ကို ပို့ခါနီးမှာ convertToHTML ဖြင့် စစ်ထုတ်သည်
    const formattedBody = convertToHTML(text);
    const footer = `\n\n--- 👤 <b>Developer Info</b> ---\n` +
                    `<b>Dev:</b> 404 \\ 2.0 🇲🇲\n` +
                    `<b>Channel:</b> <a href="https://t.me/premium_channel_404">Join Here</a>`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chat_id, 
            text: text, 
            parse_mode: "HTML",
            disable_web_page_preview: true 
        })
    });
}

// ... (downloadTelegramFile နှင့် setBotCommands တို့သည် ယခင်အတိုင်းဖြစ်သည်)
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
