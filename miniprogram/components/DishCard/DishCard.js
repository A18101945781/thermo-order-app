/**
 * DishCard 菜品卡片组件
 * 展示菜品名称、套餐类型、售价、总成本、毛利率等信息
 */
const { money } = require('../../utils/format.js');
const { getGrossRateLevel } = require('../../utils/calc.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 菜品数据对象
    dish: {
      type: Object,
      value: {},
      observer: function(newVal) {
        if (newVal && newVal._id) {
          this._updateDisplayData(newVal);
        }
      }
    },
    // 是否显示套餐类型标签
    showPackage: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    sellPriceText: '',
    totalCostText: '',
    grossRateText: '',
    grossRateClass: '',
    packageColor: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      if (this.properties.dish && this.properties.dish._id) {
        this._updateDisplayData(this.properties.dish);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新展示数据
     * @param {Object} dish 菜品数据
     */
    _updateDisplayData(dish) {
      // 格式化价格
      const sellPriceText = money(dish.sellPrice || 0);
      const totalCostText = money(dish.totalCost || 0);

      // 计算毛利率等级
      const grossRate = dish.grossRate || 0;
      const grossRateText = (grossRate * 100).toFixed(1) + '%';

      // 根据毛利率设置样式类名
      let grossRateClass = 'rate-low'; // <60% 红色
      if (grossRate >= 0.8) {
        grossRateClass = 'rate-high'; // >=80% 绿色
      } else if (grossRate >= 0.6) {
        grossRateClass = 'rate-mid'; // 60%-80% 橙色
      }

      // 套餐类型颜色映射
      const packageColorMap = {
        '团队套餐': '#FA5151',
        'SOP': '#8C6EEF',
        '单品': '#1989FA'
      };
      const packageColor = packageColorMap[dish.packageType] || '#999999';

      this.setData({
        sellPriceText,
        totalCostText,
        grossRateText,
        grossRateClass,
        packageColor
      });
    },

    /**
     * 卡片点击事件，传递菜品数据
     */
    onTap() {
      this.triggerEvent('tap', { dish: this.properties.dish });
    }
  }
});
