/**
 * ExcelUpload Excel文件上传组件
 * 支持选择.xlsx/.xls文件，预览数据，选择覆盖/追加导入模式
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 文件路径
    filePath: '',
    // 文件名
    fileName: '',
    // 文件大小（格式化文本）
    fileSize: '',
    // 数据预览文本
    previewText: '',
    // 导入模式：overwrite 覆盖 / append 追加
    importMode: 'append',
    // 解析后的数据
    parsedData: null,
    // 是否可以导入
    canImport: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 选择Excel文件
     * 使用 wx.chooseMessageFile 从聊天记录选择 .xlsx 文件
     */
    onChooseFile() {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls'],
        success: (res) => {
          const file = res.tempFiles[0];
          const filePath = file.path;
          const fileName = file.name;
          const fileSize = this._formatFileSize(file.size);

          this.setData({
            filePath,
            fileName,
            fileSize,
            previewText: '',
            parsedData: null,
            canImport: false
          });

          // 解析Excel文件并生成预览
          this._parseExcelFile(filePath);
        },
        fail: (err) => {
          if (err.errMsg.indexOf('cancel') === -1) {
            wx.showToast({
              title: '文件选择失败',
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 解析Excel文件
     * 使用 wx.getFileSystemManager 读取文件并解析
     * 注意：微信小程序端需引入 xlsx 库进行解析，此处提供基础框架
     * @param {String} filePath 文件路径
     */
    _parseExcelFile(filePath) {
      // 读取文件为 ArrayBuffer
      const fs = wx.getFileSystemManager();

      try {
        const fileData = fs.readFileSync(filePath, 'base64');

        // 尝试使用 XLSX 库解析（需要项目引入 xlsx.min.js）
        // 如果未引入XLSX库，则显示提示信息
        try {
          // 解码base64为ArrayBuffer
          const buffer = wx.base64ToArrayBuffer(fileData);
          const XLSX = require('../../libs/xlsx.min.js');
          const workbook = XLSX.read(buffer, { type: 'array' });

          // 读取第一个工作表
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 转换为JSON数组
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!data || data.length === 0) {
            wx.showToast({
              title: '文件内容为空',
              icon: 'none'
            });
            return;
          }

          // 跳过表头，将前5行数据转为预览文本
          const previewRows = data.slice(0, 6); // 含表头，共显示6行
          const previewText = previewRows.map(row =>
            (row || []).map(cell => String(cell || '')).join('\t')
          ).join('\n');

          // 提取表头行
          const headers = data[0] || [];
          // 数据行（不含表头）
          const records = data.slice(1).filter(row => {
            // 过滤空行
            return row && row.some(cell => cell !== undefined && cell !== null && cell !== '');
          });

          // 构建结构化数据对象数组
          const parsedData = records.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          });

          this.setData({
            previewText,
            parsedData: {
              headers,
              records,
              objects: parsedData
            },
            canImport: records.length > 0
          });

        } catch (libErr) {
          // XLSX库不可用时的降级处理
          console.warn('XLSX库未加载，使用基础预览:', libErr);

          // 显示文件信息作为预览
          const previewText = `文件已就绪：${this.data.fileName}\n文件大小：${this.data.fileSize}\n\n请确保项目中已引入 xlsx.min.js 库以支持完整数据预览。`;

          this.setData({
            previewText,
            parsedData: {
              rawBase64: fileData,
              fileName: this.data.fileName
            },
            canImport: true
          });
        }

      } catch (err) {
        console.error('读取文件失败:', err);
        wx.showToast({
          title: '文件读取失败',
          icon: 'none'
        });
      }
    },

    /**
     * 移除已选文件
     */
    onRemoveFile() {
      this.setData({
        filePath: '',
        fileName: '',
        fileSize: '',
        previewText: '',
        parsedData: null,
        canImport: false
      });
    },

    /**
     * 选择导入模式
     * @param {Object} e 事件对象
     */
    onSelectMode(e) {
      const { mode } = e.currentTarget.dataset;
      this.setData({ importMode: mode });
    },

    /**
     * 关闭弹窗
     */
    onClose() {
      this.triggerEvent('close');
    },

    /**
     * 开始导入
     */
    onImport() {
      if (!this.data.canImport) {
        wx.showToast({
          title: '请先选择文件',
          icon: 'none'
        });
        return;
      }

      const { parsedData, importMode } = this.data;

      // 触发导入事件，传递解析后的数据和导入模式
      this.triggerEvent('import', {
        data: parsedData,
        mode: importMode
      });
    },

    /**
     * 格式化文件大小
     * @param {Number} bytes 字节数
     * @returns {String} 格式化后的文件大小
     */
    _formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let unitIndex = 0;
      let size = bytes;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return size.toFixed(1) + ' ' + units[unitIndex];
    }
  }
});
