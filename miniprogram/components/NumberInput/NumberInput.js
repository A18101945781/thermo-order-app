/**
 * NumberInput 数字输入组件
 * 提供带加减按钮的数字输入，支持最小值限制、步进、小数位控制
 * 仅允许输入正数（含0），自动校验和格式化
 */
Component({
  options: {
    addGlobalClass: true
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 当前数值
    value: {
      type: Number,
      value: 0,
      observer: function(newVal) {
        // 当外部值变化时更新内部值
        if (newVal !== this._internalValue) {
          this._internalValue = newVal;
          this._updateDisplay();
        }
      }
    },
    // 最小值
    min: {
      type: Number,
      value: 0
    },
    // 步进值
    step: {
      type: Number,
      value: 1
    },
    // 最大值
    max: {
      type: Number,
      value: 999
    },
    // 小数位数（默认0=整数）
    decimal: {
      type: Number,
      value: 0
    },
    // 占位提示
    placeholder: {
      type: String,
      value: '请输入数量'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 显示值（字符串，用于输入框绑定）
    displayValue: '',
    // 是否聚焦
    focused: false,
    // 是否可以减少
    canDecrease: true,
    // 是否可以增加
    canIncrease: true
  },

  /**
   * 内部数值缓存
   */
  _internalValue: 0,
  // 标记是否在输入中（输入中不格式化）
  _isInputting: false,

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this._internalValue = this.properties.value || 0;
      this._updateDisplay();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新显示值和按钮状态
     */
    _updateDisplay() {
      const val = this._internalValue;
      const { min } = this.properties;

      let displayValue = '';
      if (!this._isInputting) {
        // 非输入中显示格式化值；0 一律显示为空（只留占位提示）
        // 2026-09-22：原先预填「0」时光标停在 0 前面，输入 500 会变成 5000，是输错数据的根源
        displayValue = val === 0 ? '' : this._formatValue(val);
      }

      this.setData({
        displayValue,
        canDecrease: val > min,
        canIncrease: true // 增加始终可以
      });
    },

    /**
     * 格式化数值
     * @param {Number} val 数值
     * @returns {String} 格式化后的字符串
     */
    _formatValue(val) {
      const { decimal } = this.properties;
      return val.toFixed(decimal);
    },

    /**
     * 设置数值并触发事件
     * @param {Number} val 新数值
     * @param {String} source 来源：step/input/blur
     */
    _setValue(val, source) {
      const { min, max } = this.properties;

      // 确保不小于最小值
      if (val < min) {
        val = min;
      }

      // 确保不大于最大值
      if (val > max) {
        val = max;
      }

      // 四舍五入到指定小数位
      const { decimal } = this.properties;
      const factor = Math.pow(10, decimal);
      val = Math.round(val * factor) / factor;

      this._internalValue = val;
      this._updateDisplay();

      // 触发 change 事件
      this.triggerEvent('change', { value: val, source });
    },

    /**
     * 输入事件处理
     * 实时过滤非法字符，仅允许数字和小数点
     * @param {Object} e 输入事件对象
     */
    onInput(e) {
      const rawValue = e.detail.value || '';
      const { decimal, min } = this.properties;

      // 过滤非法字符：只允许数字和一个小数点
      let filtered = rawValue.replace(/[^\d.]/g, '');

      // 只保留第一个小数点
      const dotIndex = filtered.indexOf('.');
      if (dotIndex !== -1) {
        filtered = filtered.substring(0, dotIndex + 1) +
          filtered.substring(dotIndex + 1).replace(/\./g, '');
      }

      // 限制小数位数
      if (dotIndex !== -1 && decimal > 0) {
        const decimalPart = filtered.substring(dotIndex + 1);
        if (decimalPart.length > decimal) {
          filtered = filtered.substring(0, dotIndex + 1 + decimal);
        }
      } else if (dotIndex !== -1 && decimal === 0) {
        // 不允许小数
        filtered = filtered.substring(0, dotIndex);
      }

      this._isInputting = true;
      this.setData({ displayValue: filtered });

      // 尝试解析数值
      const numVal = parseFloat(filtered);
      if (!isNaN(numVal) && numVal >= min) {
        // 超过最大值时截断
        if (numVal > this.properties.max) {
          this._internalValue = this.properties.max;
          this.setData({ displayValue: String(this.properties.max) });
        } else {
          this._internalValue = numVal;
        }
      }
    },

    /**
     * 失去焦点事件
     * 格式化显示值并触发 blur 事件
     */
    onBlur() {
      this._isInputting = false;

      const { displayValue } = this.data;
      const { min } = this.properties;

      // 解析输入值
      let numVal = parseFloat(displayValue);

      // 无效输入恢复为上次有效值或最小值
      if (isNaN(numVal) || displayValue === '' || displayValue === '.') {
        numVal = this._internalValue;
        if (isNaN(numVal)) numVal = min;
      }

      this._setValue(numVal, 'blur');
      this.triggerEvent('blur', { value: numVal });

      this.setData({ focused: false });
    },

    /**
     * 获得焦点事件
     */
    onFocus() {
      this.setData({ focused: true });
      this._isInputting = true;

      // 聚焦时显示当前数值用于编辑；0 不预填，光标不会停在 0 前面（防 500→5000，2026-09-22）
      const val = this._internalValue;
      this.setData({ displayValue: val === 0 ? '' : String(val) });
    },

    /**
     * 减少按钮点击
     */
    onDecrease() {
      const { step, min } = this.properties;
      const newVal = this._internalValue - step;

      if (newVal >= min) {
        this._isInputting = false;
        this._setValue(newVal, 'step');
      }
    },

    /**
     * 增加按钮点击
     */
    onIncrease() {
      const { step } = this.properties;
      const newVal = this._internalValue + step;

      this._isInputting = false;
      this._setValue(newVal, 'step');
    }
  }
});
