/**
 * request.js — 云函数统一请求封装
 */

/**
 * 调用云函数
 * @param {string} name - 云函数名
 * @param {Object} data - 请求数据
 * @returns {Promise}
 */
function callFunction(name, data) {
  return wx.cloud.callFunction({
    name: name,
    data: data,
  }).then(function(res) {
    if (res.result && res.result.code === 0) {
      return res.result.data
    }
    throw new Error(res.result ? res.result.message : '云函数返回异常')
  })
}

/**
 * 带超时的云函数调用
 * @param {string} name
 * @param {Object} data
 * @param {number} timeout - 超时毫秒
 */
function callWithTimeout(name, data, timeout) {
  timeout = timeout || 10000
  return Promise.race([
    callFunction(name, data),
    new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('请求超时')) }, timeout)
    }),
  ])
}

module.exports = {
  callFunction: callFunction,
  callWithTimeout: callWithTimeout,
}
