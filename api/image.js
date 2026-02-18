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

    const apiKey = process.env.AI_IMAGE_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Missing AI_IMAGE_API_KEY (or AI_API_KEY) on server' });
        return;
    }

    const body = parseBody(req);
    const prompt = String(body.prompt || '').trim();
    if (!prompt) {
        res.status(400).json({ error: 'Missing prompt' });
        return;
    }

    const apiUrl = process.env.AI_IMAGE_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/images/generations';
    const model = process.env.AI_IMAGE_MODEL || 'cogview-3-flash';

    try {
        const requestBody = {
            model,
            prompt
        };

        const upstreamResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await upstreamResponse.json().catch(() => ({}));
        if (!upstreamResponse.ok) {
            const errorMessage = data.error?.message || data.message || `Upstream error: ${upstreamResponse.status}`;
            res.status(upstreamResponse.status).json({ error: errorMessage });
            return;
        }

        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) {
            res.status(502).json({ error: 'Upstream returned empty image url' });
            return;
        }

        res.status(200).json({
            imageUrl,
            revisedPrompt: data.data?.[0]?.revised_prompt || prompt,
            model
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Image proxy failed' });
    }
};
