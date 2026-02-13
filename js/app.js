/**
 * 主应用程序 - 协调各模块工作
 */
class App {
    constructor() {
        this.currentTool = 'observation';  // 当前使用的工具
        this.formHandlers = {};  // 存储各个表单的处理器
        this.currentResult = null;
        this.results = {  // 存储各个工具的生成结果（内存中）
            observation: null,
            course: null,
            case: null,
            story: null,
            storyDesign: null,
            oneOnOne: null,
            drawing: null
        };
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        // 初始化所有表单处理器
        this.formHandlers.observation = new FormHandler('observationForm');
        this.formHandlers.course = new FormHandler('courseForm');
        this.formHandlers.case = new FormHandler('caseForm');
        this.formHandlers.story = new FormHandler('storyForm');
        this.formHandlers.storyDesign = new FormHandler('storyDesignForm');
        this.formHandlers.oneOnOne = new FormHandler('oneOnOneForm');
        this.formHandlers.drawing = new FormHandler('drawingForm');

        // 绑定事件
        this.bindEvents();

        // 检查配置
        if (!aiService.isConfigured()) {
            setTimeout(() => {
                this.showToast('请先配置API密钥', 'warning');
            }, 500);
        }
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 工具切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.getAttribute('data-tool');
                this.switchTool(tool);
            });
        });

        // 自主游戏观察表表单提交
        const observationForm = document.getElementById('observationForm');
        observationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('observation');
        });

        // 月课程表单提交
        const courseForm = document.getElementById('courseForm');
        courseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('course');
        });

        // 游戏案例表单提交
        const caseForm = document.getElementById('caseForm');
        caseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('case');
        });

        // 课程故事表单提交
        const storyForm = document.getElementById('storyForm');
        storyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('story');
        });

        // 重置表单按钮
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.handleReset('observation');
        });
        document.getElementById('resetCourseBtn').addEventListener('click', () => {
            this.handleReset('course');
        });
        document.getElementById('resetCaseBtn').addEventListener('click', () => {
            this.handleReset('case');
        });
        document.getElementById('resetStoryBtn').addEventListener('click', () => {
            this.handleReset('story');
        });

        // 课程故事设计表单提交
        const storyDesignForm = document.getElementById('storyDesignForm');
        storyDesignForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('storyDesign');
        });

        // 一对一倾听表单提交
        const oneOnOneForm = document.getElementById('oneOnOneForm');
        oneOnOneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('oneOnOne');
        });

        // 表征小人绘画器表单提交
        const drawingForm = document.getElementById('drawingForm');
        drawingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate('drawing');
        });

        // 新功能重置按钮
        document.getElementById('resetStoryDesignBtn').addEventListener('click', () => {
            this.handleReset('storyDesign');
        });
        document.getElementById('resetOneOnOneBtn').addEventListener('click', () => {
            this.handleReset('oneOnOne');
        });
        document.getElementById('resetDrawingBtn').addEventListener('click', () => {
            this.handleReset('drawing');
        });

        // 重新生成
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.handleGenerate(this.currentTool);
        });

        // 复制文本
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.handleCopy();
        });

        // 导出PDF
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.handleExportPdf();
        });

        // 导出Word
        document.getElementById('exportWordBtn').addEventListener('click', () => {
            this.handleExportWord();
        });

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // 模态框关闭
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // 点击模态框外部关闭
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettingsModal();
            }
        });

        // 保存配置
        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.handleSaveConfig();
        });

        // 测试连接
        document.getElementById('testConnectionBtn').addEventListener('click', () => {
            this.handleTestConnection();
        });

        // 清除配置
        document.getElementById('clearConfigBtn').addEventListener('click', () => {
            this.handleClearConfig();
        });

        // API服务商切换
        document.getElementById('apiProvider').addEventListener('change', (e) => {
            this.handleProviderChange(e.target.value);
            this.syncConfigFromSettings();
        });

        // 配置项变化后自动同步，避免切换后仍使用旧配置
        document.getElementById('apiModel').addEventListener('change', () => {
            this.syncConfigFromSettings();
        });
        document.getElementById('apiModel').addEventListener('input', () => {
            this.syncConfigFromSettings();
        });
        document.getElementById('apiUrl').addEventListener('change', () => {
            this.syncConfigFromSettings();
        });
        document.getElementById('apiUrl').addEventListener('input', () => {
            this.syncConfigFromSettings();
        });
        document.getElementById('apiKey').addEventListener('change', () => {
            this.syncConfigFromSettings();
        });
        document.getElementById('apiKey').addEventListener('input', () => {
            this.syncConfigFromSettings();
        });
    }

    /**
     * 获取服务商默认模型
     */
    getDefaultModel(provider) {
        const defaultModels = {
            'default_zhipu': 'glm-4',
            'deepseek': 'deepseek-chat',
            'openai': 'gpt-4',
            'zhipu': 'glm-4',
            'custom': 'gpt-4'
        };
        return defaultModels[provider] || 'glm-4';
    }

    /**
     * 处理服务商切换
     */
    handleProviderChange(provider, resetModel = true) {
        const customUrlGroup = document.getElementById('customUrlGroup');
        const modelInput = document.getElementById('apiModel');
        const apiKeyInput = document.getElementById('apiKey');

        if (provider === 'custom') {
            customUrlGroup.style.display = 'block';
        } else {
            customUrlGroup.style.display = 'none';
        }

        if (resetModel) {
            modelInput.value = this.getDefaultModel(provider);
        }

        // 切换服务商时自动回填该服务商已保存的API Key
        apiKeyInput.value = aiService.getProviderApiKey(provider) || '';
    }

    /**
     * 读取设置面板中的配置
     */
    getSettingsConfig(keepExistingApiKey = false) {
        const provider = document.getElementById('apiProvider').value;
        const apiKeyInput = document.getElementById('apiKey').value.trim();
        const modelInput = document.getElementById('apiModel').value.trim();
        const apiUrlInput = document.getElementById('apiUrl').value.trim();
        const existingProviderApiKey = aiService.getProviderApiKey(provider);

        return {
            provider: provider,
            apiKey: apiKeyInput || (keepExistingApiKey ? existingProviderApiKey : ''),
            apiUrl: apiUrlInput,
            model: modelInput || this.getDefaultModel(provider)
        };
    }

    /**
     * 解析当前实际请求地址
     */
    resolveEffectiveApiUrl(config) {
        const urlMap = {
            'default_zhipu': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            'deepseek': 'https://api.deepseek.com/v1/chat/completions',
            'openai': 'https://api.openai.com/v1/chat/completions',
            'zhipu': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            'custom': config.apiUrl
        };

        if (config.provider === 'custom' && !config.apiUrl) {
            return '未设置（请先填写自定义API地址）';
        }

        return urlMap[config.provider] || urlMap['default_zhipu'];
    }

    /**
     * 刷新设置面板中的实际API地址显示
     */
    updateActualApiUrlDisplay(config = null) {
        const actualApiUrlInput = document.getElementById('actualApiUrl');
        if (!actualApiUrlInput) return;

        const currentConfig = config || this.getSettingsConfig(true);
        actualApiUrlInput.value = this.resolveEffectiveApiUrl(currentConfig);
    }

    /**
     * 同步设置到AI服务配置
     */
    syncConfigFromSettings() {
        const config = this.getSettingsConfig(true);
        aiService.saveConfig(config);
        this.updateActualApiUrlDisplay(config);
    }

    /**
     * 切换工具
     */
    switchTool(toolType) {
        // 更新当前工具
        this.currentTool = toolType;

        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.getAttribute('data-tool') === toolType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 隐藏所有表单卡片
        document.getElementById('step1').style.display = 'none';
        document.getElementById('courseCard').style.display = 'none';
        document.getElementById('caseCard').style.display = 'none';
        document.getElementById('storyCard').style.display = 'none';
        document.getElementById('storyDesignCard').style.display = 'none';
        document.getElementById('oneOnOneCard').style.display = 'none';
        document.getElementById('drawingCard').style.display = 'none';

        // 显示对应的表单卡片
        const cardMap = {
            'observation': 'step1',
            'course': 'courseCard',
            'case': 'caseCard',
            'story': 'storyCard',
            'storyDesign': 'storyDesignCard',
            'oneOnOne': 'oneOnOneCard',
            'drawing': 'drawingCard'
        };
        document.getElementById(cardMap[toolType]).style.display = 'block';

        // 检查是否有之前生成的结果
        if (this.results[toolType]) {
            // 恢复之前的结果
            this.currentResult = this.results[toolType];
            this.displayResult(this.results[toolType], toolType);
        } else {
            // 没有结果，隐藏结果卡片
            document.getElementById('step2').style.display = 'none';
            this.currentResult = null;
        }
    }

    /**
     * 处理生成
     */
    async handleGenerate(toolType = this.currentTool) {
        // 获取对应的表单处理器
        const formHandler = this.formHandlers[toolType];

        // 验证表单
        if (!formHandler.validateForm()) {
            this.showToast('请填写所有必填项', 'error');
            return;
        }

        // 检查API配置
        if (!aiService.isConfigured()) {
            this.showToast('请先配置API密钥', 'warning');
            this.showSettingsModal();
            return;
        }

        // 获取表单数据
        const formData = formHandler.getFormData();

        // 获取生成按钮
        const btnMap = {
            'observation': 'generateBtn',
            'course': 'generateCourseBtn',
            'case': 'generateCaseBtn',
            'story': 'generateStoryBtn',
            'storyDesign': 'generateStoryDesignBtn',
            'oneOnOne': 'generateOneOnOneBtn',
            'drawing': 'generateDrawingBtn'
        };
        const generateBtn = document.getElementById(btnMap[toolType]);

        // 显示加载状态
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').style.display = 'none';
        generateBtn.querySelector('.btn-loading').style.display = 'flex';

        try {
            // 根据工具类型调用不同的生成方法
            let result;
            switch(toolType) {
                case 'observation':
                    result = await aiService.generateObservationReport(formData);
                    break;
                case 'course':
                    result = await aiService.generateCourseReport(formData);
                    break;
                case 'case':
                    result = await aiService.generateCaseReport(formData);
                    break;
                case 'story':
                    result = await aiService.generateStoryReport(formData);
                    break;
                case 'storyDesign':
                    result = await aiService.generateStoryDesignReport(formData);
                    break;
                case 'oneOnOne':
                    result = await aiService.generateOneOnOneReport(formData);
                    break;
                case 'drawing':
                    result = await aiService.generateDrawingReport(formData);
                    break;
                default:
                    throw new Error('未知的工具类型');
            }

            // 保存结果到内存中
            this.currentResult = result;
            this.results[toolType] = result;  // 保存到对应工具的内存中

            // 显示结果
            this.displayResult(result, toolType);

            // 滚动到结果区域
            document.getElementById('step2').scrollIntoView({ behavior: 'smooth' });

            this.showToast('生成成功！', 'success');
        } catch (error) {
            console.error('生成失败:', error);
            this.showToast(error.message || '生成失败,请重试', 'error');
        } finally {
            // 恢复按钮状态
            generateBtn.disabled = false;
            generateBtn.querySelector('.btn-text').style.display = 'inline';
            generateBtn.querySelector('.btn-loading').style.display = 'none';
        }
    }

    /**
     * 显示生成结果
     */
    displayResult(result, toolType = this.currentTool) {
        const resultContent = document.getElementById('resultContent');

        // 如果是绘画工具且返回的是图片数据
        if (toolType === 'drawing' && result.imageUrl) {
            // 根据类型确定标题
            const imageTitle = '生成的小人图片';
            const modelLabel = result.model === 'cogview-3-flash' ? '智谱AI CogView-3-Flash（免费）' : result.model;

            // 显示图片
            resultContent.innerHTML = `
                <div class="image-result">
                    <img src="${result.imageUrl}" alt="${imageTitle}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div class="image-info" style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                        <h3 style="margin-top: 0;">生成信息</h3>
                        <p><strong>使用模型：</strong>${modelLabel}</p>
                        <p><strong>原始描述：</strong><br>${result.prompt}</p>
                        ${result.revisedPrompt !== result.prompt ? `<p><strong>AI优化后的描述：</strong><br>${result.revisedPrompt}</p>` : ''}
                        <p class="helper-text" style="margin-bottom: 0;">💡 提示：右键点击图片可以保存到本地</p>
                    </div>
                </div>
            `;
        } else {
            // 显示Markdown文本
            const markdown = typeof result === 'string' ? result : result.content || '';
            const html = aiService.markdownToHtml(markdown);
            resultContent.innerHTML = html;
        }

        // 更新标题
        const titleMap = {
            'observation': '生成的观察表',
            'course': '生成的月课程',
            'case': '生成的游戏案例',
            'story': '生成的课程故事',
            'storyDesign': '生成的课程故事设计',
            'oneOnOne': '生成的一对一倾听记录',
            'drawing': '生成的表征小人图片'
        };
        document.querySelector('#step2 .card-header h2').textContent = titleMap[toolType];

        // 显示结果卡片
        document.getElementById('step2').style.display = 'block';
    }

    /**
     * 处理重置
     */
    handleReset(toolType = this.currentTool) {
        if (confirm('确定要重置表单吗?所有填写的内容将被清空。')) {
            this.formHandlers[toolType].resetForm();

            // 清除对应工具的生成结果
            this.results[toolType] = null;
            this.currentResult = null;

            // 隐藏结果卡片
            document.getElementById('step2').style.display = 'none';

            this.showToast('表单已重置', 'info');
        }
    }

    /**
     * 处理复制
     */
    async handleCopy() {
        if (!this.currentResult) {
            this.showToast('没有可复制的内容', 'warning');
            return;
        }

        // 如果是图片结果（仅绘画工具）
        if (this.currentTool === 'drawing' && this.currentResult.imageUrl) {
            this.showToast('图片无法复制，请右键点击图片保存', 'info');
            return;
        }

        try {
            const textContent = typeof this.currentResult === 'string' ? this.currentResult : this.currentResult.content || '';
            await navigator.clipboard.writeText(textContent);
            this.showToast('已复制到剪贴板', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('复制失败,请手动复制', 'error');
        }
    }

    /**
     * 处理导出PDF
     */
    async handleExportPdf() {
        if (!this.currentResult) {
            this.showToast('没有可导出的内容', 'warning');
            return;
        }

        // 检查库是否加载
        if (typeof html2pdf === 'undefined') {
            this.showToast('PDF导出库加载失败，请刷新页面重试', 'error');
            return;
        }

        try {
            const resultContent = document.getElementById('resultContent');

            // 生成文件名（使用工具类型和时间戳）
            const toolNames = {
                'observation': '观察表',
                'course': '月课程',
                'case': '游戏案例',
                'story': '课程故事',
                'storyDesign': '课程故事设计',
                'oneOnOne': '一对一倾听记录',
                'drawing': '表征小人描述'
            };
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${toolNames[this.currentTool]}_${timestamp}.pdf`;

            // 配置PDF选项
            const options = {
                margin: [10, 10, 10, 10],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // 显示提示
            this.showToast('正在生成PDF...', 'info');

            // 生成PDF
            await html2pdf().set(options).from(resultContent).save();

            this.showToast('PDF导出成功！', 'success');
        } catch (error) {
            console.error('PDF导出失败:', error);
            this.showToast('PDF导出失败：' + error.message, 'error');
        }
    }

    /**
     * 处理导出Word
     */
    async handleExportWord() {
        if (!this.currentResult) {
            this.showToast('没有可导出的内容', 'warning');
            return;
        }

        // 检查库是否加载
        if (typeof docx === 'undefined') {
            this.showToast('Word导出库加载失败，请刷新页面重试', 'error');
            return;
        }

        try {
            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

            // 解析 Markdown 内容为段落
            const paragraphs = this.parseMarkdownToDocx(this.currentResult);

            // 创建文档
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs
                }]
            });

            // 显示提示
            this.showToast('正在生成Word文档...', 'info');

            // 生成 blob
            const blob = await Packer.toBlob(doc);

            // 生成文件名
            const toolNames = {
                'observation': '观察表',
                'course': '月课程',
                'case': '游戏案例',
                'story': '课程故事',
                'storyDesign': '课程故事设计',
                'oneOnOne': '一对一倾听记录',
                'drawing': '表征小人描述'
            };
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${toolNames[this.currentTool]}_${timestamp}.docx`;

            // 下载文件
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);

            this.showToast('Word导出成功！', 'success');
        } catch (error) {
            console.error('Word导出失败:', error);
            this.showToast('Word导出失败：' + error.message, 'error');
        }
    }

    /**
     * 将 Markdown 内容解析为 docx 段落
     */
    parseMarkdownToDocx(markdown) {
        const { Paragraph, TextRun, HeadingLevel } = docx;
        const lines = markdown.split('\n');
        const paragraphs = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // 一级标题
            if (line.startsWith('# ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(2),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 100 }
                }));
            }
            // 二级标题
            else if (line.startsWith('## ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(3),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 80 }
                }));
            }
            // 三级标题
            else if (line.startsWith('### ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(4),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 100, after: 60 }
                }));
            }
            // 列表项
            else if (line.startsWith('- ') || /^\d+\.\s/.test(line)) {
                const text = line.replace(/^[-\d]+\.\s/, '');
                paragraphs.push(new Paragraph({
                    text: '  • ' + text,
                    spacing: { before: 50, after: 50 }
                }));
            }
            // 粗体文本
            else if (line.includes('**')) {
                const parts = line.split('**');
                const children = [];
                for (let i = 0; i < parts.length; i++) {
                    if (i % 2 === 0) {
                        if (parts[i]) children.push(new TextRun(parts[i]));
                    } else {
                        children.push(new TextRun({ text: parts[i], bold: true }));
                    }
                }
                paragraphs.push(new Paragraph({
                    children: children,
                    spacing: { before: 80, after: 80 }
                }));
            }
            // 普通段落
            else {
                paragraphs.push(new Paragraph({
                    text: line,
                    spacing: { before: 80, after: 80 }
                }));
            }
        }

        return paragraphs;
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const config = aiService.getCurrentConfig();

        // 填充当前配置
        document.getElementById('apiProvider').value = config.provider || 'default_zhipu';
        document.getElementById('apiKey').value = aiService.getProviderApiKey(config.provider || 'default_zhipu');
        document.getElementById('apiUrl').value = config.apiUrl || '';
        document.getElementById('apiModel').value = config.model || this.getDefaultModel(config.provider || 'default_zhipu');
        this.handleProviderChange(config.provider || 'default_zhipu', false);
        this.updateActualApiUrlDisplay(config);

        // 隐藏测试结果
        document.getElementById('testResult').style.display = 'none';

        modal.style.display = 'flex';
    }

    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    }

    /**
     * 处理保存配置
     */
    handleSaveConfig() {
        if (typeof aiService.isProxyMode === 'function' && aiService.isProxyMode()) {
            this.showToast('当前为云端代理模式，无需本地API配置', 'info');
            this.hideSettingsModal();
            return;
        }

        const config = this.getSettingsConfig(true);

        // 验证
        if (!config.apiKey) {
            this.showToast('请输入API密钥', 'error');
            return;
        }

        if (config.provider === 'custom' && !config.apiUrl) {
            this.showToast('请输入自定义API地址', 'error');
            return;
        }

        // 保存配置
        aiService.saveConfig(config);
        this.showToast('配置已保存', 'success');
        this.hideSettingsModal();
    }

    /**
     * 处理测试连接
     */
    async handleTestConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const testResult = document.getElementById('testResult');

        if (!(typeof aiService.isProxyMode === 'function' && aiService.isProxyMode())) {
            // 临时保存配置
            const tempConfig = this.getSettingsConfig(true);
            aiService.saveConfig(tempConfig);
        }

        // 显示测试中
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';
        testResult.style.display = 'none';

        try {
            const result = await aiService.testConnection();

            testResult.style.display = 'block';
            if (result.success) {
                testResult.className = 'test-result success';
                testResult.textContent = '✓ ' + result.message;
            } else {
                testResult.className = 'test-result error';
                testResult.textContent = '✗ ' + result.message;
            }
        } catch (error) {
            testResult.style.display = 'block';
            testResult.className = 'test-result error';
            testResult.textContent = '✗ 测试失败: ' + error.message;
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = '测试连接';
        }
    }

    /**
     * 处理清除配置
     */
    handleClearConfig() {
        if (confirm('确定要清除所有配置吗?')) {
            aiService.clearConfig();
            this.showToast('配置已清除', 'info');
            this.hideSettingsModal();
        }
    }

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        // 3秒后自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new App();
        console.log('应用初始化成功');
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('应用初始化失败，请刷新页面重试。错误: ' + error.message);
    }
});
