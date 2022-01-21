// 发送ajax请求
/* 1、封装功能函数...*/

import config from './config'
export default (url, data={}, hostNum = 0, method='GET') => {
  return new Promise((resolve, reject) => {
    // 默认使用http://localhost:3000服务器
    var host = config.host;
    if (hostNum == 1) {
      host = config.host1;
    }
    wx.request({
      // 用于真机调试
      // url: config.mobileHost + url,
      url: host + url,
      data,
      method,
      header: {
        cookie: wx.getStorageSync('cookies')?wx.getStorageSync('cookies').find(item => item.indexOf('MUSIC_U') !== -1):''
      },
      success: (res) => {
        // console.log('请求成功：', res);
        if(data.isLogin) { //登录请求
          // 将用户的cookies存入本地
          wx.setStorage({key: 'cookies', data: res.cookies});
        }
        resolve(res.data); // 修改promise的状态为成功状态resolved
      },
      fail: (err) => {
        // console.log('请求失败：', err);
        reject(err); // 修改promise的状态为失败状态rejected
      }
    })
  })
}