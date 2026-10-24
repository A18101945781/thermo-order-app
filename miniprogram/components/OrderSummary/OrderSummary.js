/**
 * OrderSummary 订单汇总弹窗组件
 * 展示按供应商分组的原料采购明细，含损耗系数和采购总金额
 */
const { money, supplierShort } = require('../../utils/format.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      value: false
    },
    // 原料汇总数据 [{name, price, unit, totalUsage, curStock, minStock, suggestBuy, purchaseAmount, supplier}, ...]
    materialTotal: {
      type: Array,
      value: []
    },
    // 采购总金额（含损耗）
    totalMoney: {
      type: Number,
      value: 0
    },
    // 损耗系数
    lossRate: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 按供应商分组的原料数据
    supplierGroups: [],
    // 格式化后的总金额
    totalMoneyText: ''
  },

  /**
   * 观测器
   */
  observers: {
    'materialTotal,totalMoney'(materialTotal, totalMoney) {
      this._processData(materialTotal, totalMoney);
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { materialTotal, totalMoney } = this.properties;
      this._processData(materialTotal, totalMoney);
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理汇总数据，按供应商分组
     * @param {Array} materialTotal 原料汇总数据
     * @param {Number} totalMoney 总金额
     */
    _processData(materialTotal, totalMoney) {
      // 按供应商分组
      const groupMap = {};
      const supplierOrder = []; // 保持供应商出现顺序

      (materialTotal || []).forEach(mat => {
        const supplier = mat.supplier || '未分类';

        if (!groupMap[supplier]) {
          groupMap[supplier] = {
            supplier: supplier,
            materials: [],
            subtotal: 0
          };
          supplierOrder.push(supplier);
        }

        // 计算建议采购量和采购金额
        const totalUsage = mat.totalUsage || 0;
        const curStock = mat.curStock || 0;
        const suggestBuy = Math.max(0, totalUsage - curStock);
        const purchaseAmount = suggestBuy * (mat.price || 0);

        const materialItem = {
          name: mat.name,
          price: mat.price || 0,
          unit: mat.unit || '',
          totalUsage: totalUsage,
          curStock: curStock,
          suggestBuy: suggestBuy,
          purchaseAmount: purchaseAmount
        };

        groupMap[supplier].materials.push(materialItem);
        groupMap[supplier].subtotal += purchaseAmount;
      });

      // 转换为数组并格式化小计
      const supplierGroups = supplierOrder.map(key => {
        const group = groupMap[key];
        group.subtotal = Math.round(group.subtotal * 100) / 100;
        return group;
      });

      const totalMoneyText = money(totalMoney || 0);

      this.setData({ supplierGroups, totalMoneyText });
    },

    /**
     * 格式化金额
     * @param {Number} val 金额
     * @returns {String}
     */
    moneyText(val) {
      return money(val);
    },

    /**
     * 供应商名称缩写
     * @param {String} name 供应商全名
     * @returns {String}
     */
    supplierShort(name) {
      return supplierShort(name);
    },

    /**
     * 关闭弹窗
     */
    onClose() {
      this.triggerEvent('close');
    },

    /**
     * 确认下单
     */
    onConfirm() {
      const { materialTotal, totalMoney, lossRate } = this.properties;
      this.triggerEvent('confirm', {
        materialTotal,
        totalMoney,
        lossRate
      });
    }
  }
});
