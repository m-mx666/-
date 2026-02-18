module.exports = async function handler(req, res) {
    const chatReady = Boolean(process.env.AI_API_KEY && process.env.AI_CHAT_MODEL);
    const imageReady = Boolean(process.env.AI_IMAGE_API_KEY || process.env.AI_API_KEY);

    res.status(200).json({
        ok: true,
        message: 'Server proxy is ready',
        services: {
            chat: chatReady,
            image: imageReady
        }
    });
};
