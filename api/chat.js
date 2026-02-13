const BUILTIN_ZHIPU_API_KEY = 'bdc3f7b42c3947488b4c32374e00fb6e.niRBX4bM5e7uFDyw';

function parseBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }
    return req.body;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const apiKey = process.env.AI_API_KEY || BUILTIN_ZHIPU_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Missing AI_API_KEY on server' });
        return;
    }

    const body = parseBody(req);
    const prompt = String(body.prompt || '').trim();
    const toolType = String(body.toolType || 'observation');
    if (!prompt) {
        res.status(400).json({ error: 'Missing prompt' });
        return;
    }

    const apiUrl = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    const model = process.env.AI_CHAT_MODEL || 'glm-4';
    const maxTokens = Number(process.env.AI_MAX_TOKENS || (toolType === 'story' ? 3000 : 2000));

    try {
        const upstreamResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: maxTokens
            })
        });

        const data = await upstreamResponse.json().catch(() => ({}));
        if (!upstreamResponse.ok) {
            const errorMessage = data.error?.message || data.message || `Upstream error: ${upstreamResponse.status}`;
            res.status(upstreamResponse.status).json({ error: errorMessage });
            return;
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            res.status(502).json({ error: 'Upstream returned empty content' });
            return;
        }

        res.status(200).json({ content, model });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Chat proxy failed' });
    }
};
