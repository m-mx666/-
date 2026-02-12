/**
 * AI服务类 - 封装AI接口调用
 */
class AIService {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
        return {
            provider: 'deepseek',
            apiKey: '',
            apiUrl: '',
            model: 'deepseek-chat',
            apiKeys: {
                deepseek: '',
                openai: '',
                zhipu: '',
                custom: ''
            }
        };
    }

    /**
     * 归一化配置（兼容旧版单apiKey结构）
     */
    normalizeConfig(rawConfig = {}) {
        const defaults = this.getDefaultConfig();
        const normalized = {
            ...defaults,
            ...rawConfig,
            apiKeys: {
                ...defaults.apiKeys,
                ...(rawConfig.apiKeys || {})
            }
        };

        const provider = normalized.provider || 'deepseek';

        // 兼容旧版：只有apiKey时，把它迁移到当前provider名下
        if (rawConfig.apiKey && !normalized.apiKeys[provider]) {
            normalized.apiKeys[provider] = rawConfig.apiKey;
        }

        normalized.provider = provider;
        normalized.apiKey = normalized.apiKeys[provider] || '';
        return normalized;
    }

    /**
     * 从localStorage加载配置
     */
    loadConfig() {
        const saved = localStorage.getItem('ai_config');
        if (!saved) {
            return this.getDefaultConfig();
        }

        try {
            const parsed = JSON.parse(saved);
            return this.normalizeConfig(parsed);
        } catch (error) {
            console.warn('配置解析失败，已重置为默认配置:', error);
            return this.getDefaultConfig();
        }
    }

    /**
     * 保存配置到localStorage
     */
    saveConfig(config) {
        const current = this.getCurrentConfig();
        const targetProvider = config.provider || current.provider || 'deepseek';
        const merged = {
            ...current,
            ...config,
            provider: targetProvider,
            apiKeys: {
                ...(current.apiKeys || {}),
                ...(config.apiKeys || {})
            }
        };

        // apiKey按provider分别保存
        if (Object.prototype.hasOwnProperty.call(config, 'apiKey')) {
            merged.apiKeys[targetProvider] = config.apiKey || '';
        }

        merged.apiKey = merged.apiKeys[targetProvider] || '';

        this.config = this.normalizeConfig(merged);
        localStorage.setItem('ai_config', JSON.stringify(this.config));
    }

    /**
     * 获取最新配置（以localStorage为准）
     */
    getCurrentConfig() {
        this.config = this.normalizeConfig(this.loadConfig());
        return this.config;
    }

    /**
     * 获取指定服务商保存的API Key
     */
    getProviderApiKey(provider = null) {
        const config = this.getCurrentConfig();
        const targetProvider = provider || config.provider || 'deepseek';
        return (config.apiKeys && config.apiKeys[targetProvider]) || '';
    }

    /**
     * 清除配置
     */
    clearConfig() {
        localStorage.removeItem('ai_config');
        this.config = this.getDefaultConfig();
    }

    /**
     * 检查配置是否完整
     */
    isConfigured() {
        const config = this.getCurrentConfig();
        const apiKey = this.getProviderApiKey(config.provider);
        return apiKey && apiKey.trim() !== '';
    }

    /**
     * 获取API端点URL
     */
    getApiUrl(config = this.getCurrentConfig()) {
        const urls = {
            'deepseek': 'https://api.deepseek.com/v1/chat/completions',
            'openai': 'https://api.openai.com/v1/chat/completions',
            'zhipu': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            'custom': config.apiUrl
        };
        return urls[config.provider] || urls['deepseek'];
    }

    /**
     * 构建观察表生成提示词
     */
    buildObservationPrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长编写专业的幼儿游戏观察记录。

任务：根据以下信息,生成一份详细的"幼儿自主游戏观察记录表"。

输入信息：
- 游戏名称：${formData.gameName}
- 观察对象：${formData.observer}
- 观察时间：${formData.observeDate}
- 观察年龄：${formData.ageGroup}
- 观察地点：${formData.location}
- 观察方式：${formData.method}
- 观察方法：${formData.frequency}

输出要求：
1. **基本信息**：整理并展示上述输入信息
2. **材料投放情况**：列举该游戏区域可能涉及的材料(3-5种)
3. **观察方式和方法**：扩展说明观察方式和方法的具体操作
4. **观察目的**：阐述观察该游戏的教育价值和发展目标(80-120字)
5. **观察描述**：
   - 情景一：详细描述游戏开始和进行过程,包括幼儿的动作、语言、表情(200-300字)
   - 情景二：描述幼儿的合作互动或问题解决过程(150-200字)
6. **观察分析**：从幼儿发展角度分析行为表现,包括认知、社会性、创造力等方面(200-250字)
7. **教师支持策略**：提出2-3条具体的支持建议

格式要求：
- 使用清晰的Markdown格式
- 每个部分用二级标题(##)标注
- 内容专业、具体、符合幼教实践
- 语言流畅自然,避免生硬的模板化表述`;
    }

    /**
     * 构建月课程生成提示词
     */
    buildCoursePrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长设计月度主题课程。

任务：根据以下信息,生成一份详细的"幼儿园月主题课程计划"。

输入信息：
- 月份：${formData.courseMonth}
- 年龄班：${formData.courseAgeGroup}
- 主题名称：${formData.courseTheme}
- 重点领域：${formData.courseFocus}
- 课程目标：${formData.courseGoals || '请根据主题设定合适目标'}

输出要求：
1. **主题概述**：简要介绍主题背景和意义(100-150字)
2. **月度目标**：
   - 健康领域目标(2-3条)
   - 语言领域目标(2-3条)
   - 社会领域目标(2-3条)
   - 科学领域目标(2-3条)
   - 艺术领域目标(2-3条)
3. **课程安排**：设计4周的活动计划
   - 第一周：活动名称、活动类型、活动目标(3-4个活动)
   - 第二周：活动名称、活动类型、活动目标(3-4个活动)
   - 第三周：活动名称、活动类型、活动目标(3-4个活动)
   - 第四周：活动名称、活动类型、活动目标(3-4个活动)
4. **环境创设**：描述主题墙、区域布置建议(150-200字)
5. **家园共育**：提出2-3条家园合作建议

格式要求：
- 使用清晰的Markdown格式
- 每个部分用二级标题(##)标注
- 内容专业、可操作、符合幼教实践
- 活动多样化,涵盖五大领域`;
    }

    /**
     * 构建游戏案例生成提示词
     */
    buildCasePrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长设计和实施各类幼儿游戏。

任务：根据以下信息,生成一份详细的"幼儿游戏活动案例"。

输入信息：
- 游戏名称：${formData.caseGameName}
- 适合年龄：${formData.caseAgeGroup}
- 游戏类型：${formData.caseType}
- 游戏时长：${formData.caseDuration}
- 重点说明：${formData.caseKeyPoints || '无特别说明'}

输出要求：
1. **游戏名称和类型**：明确标注
2. **适合年龄**：说明适合的年龄段和发展特点
3. **游戏目标**：
   - 认知目标(1-2条)
   - 社会性目标(1-2条)
   - 身体发展目标(1-2条,如适用)
4. **材料准备**：
   - 教师准备材料(5-8种)
   - 幼儿自备材料(2-3种,如需要)
5. **游戏玩法**：
   - 导入环节(50-80字)
   - 基本玩法(200-250字,分步骤说明)
   - 规则说明(3-5条规则)
   - 进阶玩法(100-150字,提供2-3种变化)
6. **教师指导要点**：
   - 观察要点(3-4条)
   - 支持策略(3-4条)
   - 安全注意事项(2-3条)
7. **游戏延伸**：提供2-3个相关延伸活动建议

格式要求：
- 使用清晰的Markdown格式
- 每个部分用二级标题(##)标注
- 内容详细、可操作、易于实施
- 体现幼儿的主体性和游戏的趣味性`;
    }

    /**
     * 构建课程故事生成提示词
     */
    buildStoryPrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长用叙事的方式记录和呈现课程实施过程。

任务：根据以下信息,生成一份生动的"幼儿园课程故事"。

输入信息：
- 故事主题：${formData.storyTitle}
- 适合年龄：${formData.storyAgeGroup}
- 领域：${formData.storyArea}
- 活动日期：${formData.storyDate}
- 活动亮点：${formData.storyHighlight || '请基于主题创作精彩内容'}

输出要求：
1. **故事标题**：富有吸引力的标题(10-15字)
2. **活动背景**：
   - 时间、地点、参与人员
   - 活动的缘起和情境(100-150字)
3. **故事正文**：用生动的叙事方式展现活动过程
   - 开端：活动如何引发幼儿兴趣(150-200字)
   - 发展：幼儿的探索、发现、互动过程(300-400字)
     - 包含2-3个具体情景片段
     - 捕捉幼儿的语言、动作、表情
     - 展现幼儿的思维和情感变化
   - 高潮：活动中的精彩瞬间或转折点(150-200字)
   - 结尾：活动的收获和延伸(100-150字)
4. **教师反思**：
   - 幼儿的学习与发展(100-150字)
   - 教师的发现和感悟(100-150字)
   - 后续支持计划(80-100字)
5. **课程价值分析**：
   - 体现的课程理念(2-3条)
   - 促进的核心经验(2-3条)

格式要求：
- 使用清晰的Markdown格式
- 故事正文采用第一人称或第三人称叙述
- 语言生动、细节丰富、情感真实
- 体现"儿童视角",以幼儿为主体
- 展现教师的专业观察和回应
- 避免空洞说教,注重真实呈现`;
    }

    /**
     * 通用的内容生成方法
     */
    async generateContent(prompt, toolType = 'observation') {
        const config = this.getCurrentConfig();

        if (!config.apiKey || config.apiKey.trim() === '') {
            throw new Error('请先配置API密钥');
        }

        const apiUrl = this.getApiUrl(config);

        try {
            const requestBody = {
                model: config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: toolType === 'story' ? 3000 : 2000  // 课程故事需要更多tokens
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // 提取生成的内容
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            } else {
                throw new Error('API返回数据格式异常');
            }
        } catch (error) {
            console.error('AI生成错误:', error);

            // 友好的错误提示
            if (error.message.includes('fetch')) {
                throw new Error('网络连接失败,请检查网络设置');
            } else if (error.message.includes('401')) {
                throw new Error('API密钥无效,请检查配置');
            } else if (error.message.includes('429')) {
                throw new Error('API调用频率超限,请稍后重试');
            } else if (error.message.includes('500')) {
                throw new Error('AI服务暂时不可用,请稍后重试');
            } else {
                throw error;
            }
        }
    }

    /**
     * 调用AI接口生成观察表
     */
    async generateObservationReport(formData) {
        const prompt = this.buildObservationPrompt(formData);
        return await this.generateContent(prompt, 'observation');
    }

    /**
     * 调用AI接口生成月课程
     */
    async generateCourseReport(formData) {
        const prompt = this.buildCoursePrompt(formData);
        return await this.generateContent(prompt, 'course');
    }

    /**
     * 调用AI接口生成游戏案例
     */
    async generateCaseReport(formData) {
        const prompt = this.buildCasePrompt(formData);
        return await this.generateContent(prompt, 'case');
    }

    /**
     * 调用AI接口生成课程故事
     */
    async generateStoryReport(formData) {
        const prompt = this.buildStoryPrompt(formData);
        return await this.generateContent(prompt, 'story');
    }

    /**
     * 构建课程故事设计提示词
     */
    /**
     * 构建课程故事设计提示词
     */
    buildStoryDesignPrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长设计富有教育意义的课程故事。

任务：根据以下信息,设计一份详细的"幼儿园课程故事设计方案"。

输入信息：
- 课程主题：${formData.designTheme}
- 故事背景：${formData.designBackground || '请根据主题创作合适的背景'}
- 故事梗概：${formData.designObjectives || '请根据主题设计吸引人的故事情节'}

输出要求：
1. **故事背景**：设置一个吸引幼儿的故事情境(100-150字)
2. **主要角色**：设计2-4个主要角色(每个角色50-80字)
   - 角色名称和特点
   - 角色在故事中的作用
3. **故事情节**：分阶段展开故事(600-800字)
   - 开端：问题或冲突的引入(150-200字)
   - 发展：角色们如何面对和解决(250-350字)
   - 高潮：最精彩或最紧张的部分(150-200字)
   - 结局：问题解决和收获(100-150字)
4. **教育价值**：
   - 涉及的五大领域发展目标(3-5条)
   - 培养的核心素养(3-4条)
5. **活动延伸建议**：提供2-3个相关延伸活动
6. **实施建议**：
   - 讲述技巧(3-4条)
   - 互动环节设计(2-3个)

格式要求：
- 使用清晰的Markdown格式
- 故事情节要生动有趣,符合幼儿认知水平
- 富有教育意义,但不说教
- 语言儿童化,易于理解`;
    }

    /**
     * 构建一对一倾听提示词
     */
    buildOneOnOnePrompt(formData) {
        return `角色：你是一位资深幼儿园教师,擅长进行一对一的儿童观察和倾听。

任务：根据以下信息,生成一份详细的"一对一倾听观察记录表"。

输入信息：
- 观察对象：${formData.oneObserver}
- 班级：${formData.oneGroup}
- 地点：${formData.onePlace}
- 观察活动：${formData.oneActivity}
- 观察测试：${formData.oneTest || '无特别说明'}

输出要求：
1. **基本信息**：
   - 观察对象、班级、地点、活动
   - 观察时间(建议填写)
   - 观察教师(建议填写)
2. **观察背景**：
   - 活动情境描述(80-120字)
   - 幼儿当时的状态(50-80字)
3. **倾听记录**：
   - 对话实录：记录师幼对话内容(200-300字)
     - 教师提问
     - 幼儿回应
     - 注意记录幼儿的原话和表达方式
   - 非言语表现：记录幼儿的表情、动作、情绪等(100-150字)
4. **倾听分析**：
   - 语言发展水平分析(100-150字)
   - 思维特点分析(100-150字)
   - 情感态度分析(80-120字)
5. **发展评估**：
   - 优势表现(2-3条)
   - 需要支持的方面(2-3条)
6. **教育建议**：
   - 家园共育建议(2-3条)
   - 后续观察重点(2-3条)

格式要求：
- 使用清晰的Markdown格式
- 对话记录要真实自然
- 分析专业,有依据
- 建议具体可操作`;
    }

    /**
     * 构建表征小人绘画器提示词
     */
    /**
     * 构建图像生成提示词（智谱AI CogView）
     */
    buildImagePrompt(formData) {
        // 风格映射（中文）
        const styleMap = {
            '彩铅': '彩色铅笔画',
            '水彩': '水彩画',
            '彩铅水彩混合': '彩铅水彩混合风格',
            '黑白': '纯黑白铅笔素描'
        };

        // 线条映射（中文）
        const lineMap = {
            '粗': '粗线条',
            '细': '细线条'
        };

        const style = styleMap[formData.drawingStyle] || '简笔画';
        const line = lineMap[formData.drawingLine] || '中等线条';

        // 如果是黑白风格，特别强调只使用黑白色
        const colorInstruction = formData.drawingStyle === '黑白'
            ? '，画面只使用黑色和白色，不要任何彩色，纯黑白灰度图像，monochrome'
            : '';

        // 构建中文提示词（智谱AI支持中文提示词效果更好）
        return `${style}风格的儿童插画，${line}，画面内容：${formData.drawingDesc}${colorInstruction}。适合幼儿园教学使用，简洁清晰的构图，可爱友好的角色设计，白色背景，适合3-6岁幼儿。`;
    }

    /**
     * 生成图片（使用智谱AI CogView）
     */
    async generateImage(formData) {
        const config = this.getCurrentConfig();

        // 检查配置
        if (!config.apiKey) {
            throw new Error('请先配置API密钥');
        }

        const imagePrompt = this.buildImagePrompt(formData);

        // 确定使用的模型和API端点
        let apiUrl;
        let requestBody;

        if (config.provider === 'zhipu') {
            // 智谱AI - CogView
            apiUrl = 'https://open.bigmodel.cn/api/paas/v4/images/generations';
            requestBody = {
                model: 'cogview-3-flash',  // 使用免费的flash版本
                prompt: imagePrompt
            };
        } else if (config.provider === 'deepseek') {
            // DeepSeek不支持图像生成，提示用户
            throw new Error('DeepSeek暂不支持图像生成，请在设置中切换到"智谱AI"');
        } else if (config.provider === 'openai') {
            // OpenAI - DALL-E 3（备用方案）
            apiUrl = 'https://api.openai.com/v1/images/generations';
            requestBody = {
                model: 'dall-e-3',
                prompt: imagePrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural'
            };
        } else {
            throw new Error('当前API服务商不支持图像生成，请在设置中选择"智谱AI"');
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
            }

            const data = await response.json();

            // 智谱AI和OpenAI返回格式相同
            if (!data.data || !data.data[0] || !data.data[0].url) {
                throw new Error('API返回格式错误');
            }

            return {
                imageUrl: data.data[0].url,
                prompt: imagePrompt,
                revisedPrompt: data.data[0].revised_prompt || imagePrompt,
                model: config.provider === 'zhipu' ? 'cogview-3-flash' : 'dall-e-3'
            };

        } catch (error) {
            console.error('图像生成失败:', error);
            throw new Error(error.message || '图像生成失败,请重试');
        }
    }

    /**
     * 调用AI接口生成课程故事设计
     */
    async generateStoryDesignReport(formData) {
        const prompt = this.buildStoryDesignPrompt(formData);
        return await this.generateContent(prompt, 'storyDesign');
    }

    /**
     * 调用AI接口生成一对一倾听记录
     */
    async generateOneOnOneReport(formData) {
        const prompt = this.buildOneOnOnePrompt(formData);
        return await this.generateContent(prompt, 'oneOnOne');
    }

    /**
     * 调用AI接口生成绘画图片
     */
    async generateDrawingReport(formData) {
        // 直接生成图片
        return await this.generateImage(formData);
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        const config = this.getCurrentConfig();

        if (!config.apiKey || config.apiKey.trim() === '') {
            throw new Error('请先输入API密钥');
        }

        const apiUrl = this.getApiUrl(config);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        {
                            role: 'user',
                            content: '你好'
                        }
                    ],
                    max_tokens: 10
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `连接失败: ${response.status}`);
            }

            return { success: true, message: '连接成功！API配置正确' };
        } catch (error) {
            console.error('连接测试失败:', error);
            return { success: false, message: error.message || '连接失败,请检查配置' };
        }
    }

    /**
     * 将Markdown转换为HTML
     */
    markdownToHtml(markdown) {
        let html = markdown;

        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // 粗体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 列表
        html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*)$/gim, '<li>$1</li>');

        // 包装列表
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // 清理多余标签
        html = html.replace(/<p><h/g, '<h');
        html = html.replace(/<\/h\d><\/p>/g, (match) => match.replace(/<\/?p>/g, ''));
        html = html.replace(/<p><ul>/g, '<ul>');
        html = html.replace(/<\/ul><\/p>/g, '</ul>');

        return html;
    }
}

// 创建全局实例
// --- Server-proxy mode (public deployment) ---
// In proxy mode, browser does not store or send provider API keys.
AIService.prototype.isProxyMode = function () {
    return true;
};

AIService.prototype.isConfigured = function () {
    if (this.isProxyMode()) {
        return true;
    }
    const config = this.getCurrentConfig();
    const apiKey = this.getProviderApiKey(config.provider);
    return apiKey && apiKey.trim() !== '';
};

AIService.prototype.generateContent = async function (prompt, toolType = 'observation') {
    if (!this.isProxyMode()) {
        throw new Error('Direct API mode is disabled in this deployment');
    }

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            toolType
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed: ${response.status}`);
    }
    if (!data.content) {
        throw new Error('Empty content returned by /api/chat');
    }
    return data.content;
};

AIService.prototype.generateImage = async function (formData) {
    if (!this.isProxyMode()) {
        throw new Error('Direct image API mode is disabled in this deployment');
    }

    const imagePrompt = this.buildImagePrompt(formData);
    const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: imagePrompt
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.message || `Image request failed: ${response.status}`);
    }
    if (!data.imageUrl) {
        throw new Error('Empty imageUrl returned by /api/image');
    }

    return {
        imageUrl: data.imageUrl,
        prompt: imagePrompt,
        revisedPrompt: data.revisedPrompt || imagePrompt,
        model: data.model || 'server-proxy-image-model'
    };
};

AIService.prototype.testConnection = async function () {
    try {
        const response = await fetch('/api/health', { method: 'GET' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { success: false, message: data.error || `Service check failed: ${response.status}` };
        }
        return { success: true, message: data.message || 'Server proxy is ready' };
    } catch (error) {
        return { success: false, message: error.message || 'Service check failed' };
    }
};

const aiService = new AIService();
