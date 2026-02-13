const BUILTIN_ZHIPU_API_KEY = 'bdc3f7b42c3947488b4c32374e00fb6e.niRBX4bM5e7uFDyw';

module.exports = async function handler(req, res) {
    const chatReady = Boolean(process.env.AI_API_KEY || BUILTIN_ZHIPU_API_KEY);
    const imageReady = Boolean(process.env.AI_IMAGE_API_KEY || process.env.AI_API_KEY || BUILTIN_ZHIPU_API_KEY);

    res.status(200).json({
        ok: true,
        message: 'Server proxy is ready',
        services: {
            chat: chatReady,
            image: imageReady
        }
    });
};
