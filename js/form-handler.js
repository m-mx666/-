/**
 * 表单处理类 - 负责表单验证和数据处理
 */
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }

    /**
     * 初始化表单
     */
    init() {
        if (!this.form) {
            console.error('表单未找到');
            return;
        }

        // 收集表单字段
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.fields[input.name] = input;

            // 添加实时验证
            input.addEventListener('blur', () => {
                this.validateField(input.name);
            });

            // 清除错误提示
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
            });
        });

        // 设置默认日期为今天（仅对date类型的字段）
        const dateInputs = this.form.querySelectorAll('input[type="date"]');
        const todayDate = new Date().toISOString().split('T')[0];
        dateInputs.forEach(dateInput => {
            if (!dateInput.value) {
                dateInput.value = todayDate;
            }
            dateInput.max = todayDate; // 限制不能选择未来日期
        });

        // 设置默认月份为当前月（仅对month类型的字段）
        const monthInputs = this.form.querySelectorAll('input[type="month"]');
        const todayForMonth = new Date();
        const currentMonth = `${todayForMonth.getFullYear()}-${String(todayForMonth.getMonth() + 1).padStart(2, '0')}`;
        monthInputs.forEach(monthInput => {
            if (!monthInput.value) {
                monthInput.value = currentMonth;
            }
        });

        // 不需要数据持久化，移除localStorage相关功能
    }

    /**
     * 验证单个字段
     */
    validateField(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return true;

        const value = field.value.trim();
        const errorSpan = field.parentElement.querySelector('.error-message');

        // 必填验证
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(fieldName, '此项为必填');
            return false;
        }

        // 日期验证
        if (field.type === 'date' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                this.showFieldError(fieldName, '观察时间不能晚于今天');
                return false;
            }
        }

        this.clearFieldError(fieldName);
        return true;
    }

    /**
     * 显示字段错误
     */
    showFieldError(fieldName, message) {
        const field = this.fields[fieldName];
        if (!field) return;

        const errorSpan = field.parentElement.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = message;
        }

        field.classList.add('error');
        field.style.borderColor = 'var(--danger-color)';
    }

    /**
     * 清除字段错误
     */
    clearFieldError(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return;

        const errorSpan = field.parentElement.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = '';
        }

        field.classList.remove('error');
        field.style.borderColor = '';
    }

    /**
     * 验证整个表单
     */
    validateForm() {
        let isValid = true;

        // 自动检测所有required字段
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (field.hasAttribute('required')) {
                if (!this.validateField(fieldName)) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    /**
     * 获取表单数据
     */
    getFormData() {
        const data = {};
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (field.type === 'file') {
                data[fieldName] = field.files[0] || null;
            } else {
                data[fieldName] = field.value.trim();
            }
        });
        return data;
    }

    /**
     * 设置表单数据
     */
    setFormData(data) {
        Object.keys(data).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (field && field.type !== 'file') {
                field.value = data[fieldName] || '';
            }
        });
    }

    /**
     * 重置表单
     */
    resetForm() {
        this.form.reset();

        // 重新设置默认日期（所有date类型的字段）
        const dateInputs = this.form.querySelectorAll('input[type="date"]');
        const todayDate = new Date().toISOString().split('T')[0];
        dateInputs.forEach(dateInput => {
            dateInput.value = todayDate;
        });

        // 重新设置默认月份（所有month类型的字段）
        const monthInputs = this.form.querySelectorAll('input[type="month"]');
        const todayForMonth = new Date();
        const currentMonth = `${todayForMonth.getFullYear()}-${String(todayForMonth.getMonth() + 1).padStart(2, '0')}`;
        monthInputs.forEach(monthInput => {
            monthInput.value = currentMonth;
        });

        // 清除所有错误提示
        Object.keys(this.fields).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }

    /**
     * 格式化日期显示
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    /**
     * 获取格式化的表单数据(用于显示)
     */
    getFormattedData() {
        const data = this.getFormData();
        return {
            ...data,
            observeDate: this.formatDate(data.observeDate)
        };
    }
}
