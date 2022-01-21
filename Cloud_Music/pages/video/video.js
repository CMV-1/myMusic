import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: {}, // 导航标签数据
    navId: 0, // 导航的标识
    offset: 0, // 当前页面的offset值
    videoList: [], //视频列表数据
    videoId: '', // 视频id标识
    videoUpdateTime: [], // 记录video的播放时间
    isTriggered: false, // 标识下拉刷新是否被触发
    isToLower: false, // 标识下拉刷新是否被触发
    times: 1, // 记录上拉触发次数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          // 跳转至登录界面
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
      return;
    }
    // 获取导航数据
    this.getVideoGroupListData();
  },

  // 获取导航数据的功能函数
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list');
    let videoGroupList = videoGroupListData.data.splice(0, 14);
    this.setData({
      videoGroupList,
      navId: videoGroupList[0].id
    })
    // 获取视频数据
    this.getVideoList(this.data.navId);
  },

  // 获取视频数据的功能函数
  async getVideoList(navId) {
    let videoListData = await request('/video/group', {id: navId, offset: this.data.offset * 8});
    // offset改变发送请求可以得到不同的数据
    let offset = this.data.offset + 1;
    // 关闭消息提示框（用于导航栏切换时）
    wx.hideLoading();
    // 如果是上拉触底走这一步
    if (this.data.isToLower) {
      // 为请求到的数据对象添加id属性
      let times = this.data.times;
      let index = 8 * times;
      var videoList = videoListData.datas.map(item => {
        item.id = index++;
        return item;
      })
      this.setData({
        times: times + 1
      })
      // 拿到原来视频数据
      let oldVideoList = this.data.videoList;
      // 将新请求到的数据添加到原先数据后面
      oldVideoList.push(...videoList);
      // 得到的新数组重新赋值给videoList
      videoList = oldVideoList;
    } else {
      // 为请求到的数据对象添加id属性
      let index = 0;
      var videoList = videoListData.datas.map(item => {
        item.id = index++;
        return item;
      })
    }
    this.setData({
      videoList,
      isToLower: false, // 关闭上拉触底
      isTriggered: false, // 关闭下拉刷新
      offset // 更新offset值
    })
  },

  // 点击切换导航的问题
  changeNav(event) {
    let navId = event.currentTarget.id; // 拿到的是字符串
    this.setData({
      navId: navId>>>0, // 字符串转数字
      videoList: [], // 清空上一导航内容的数据
      offset: 0, // 清空上一导航offset的值
      times: 1, // 还原上拉触底次数
    })
    // 显示正在加载
    wx.showLoading({
      title: '正在加载',
    })
    // 动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId);
  },

  // 点击播放/继续播放的回调
  handlePlay(event) {
    let vid = event.currentTarget.id; 
    // // 关闭上一个播放的视频
    // this.vid !== vid && this.videoContext && this.videoContext.stop();
    // this.vid = vid;

    // 更新data中videoId的状态数据
    this.setData({
      videoId: vid
    })
    // 创建控制video标签的对象
    this.videoContext = wx.createVideoContext(vid);
    // 判断之前的视频是否播放过，是否有播放记录，如果有，跳转至指定的播放位置
    let {videoUpdateTime} = this.data;
    let videoItem = videoUpdateTime.find(item => item.vid === vid);
    if(videoItem) {
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play();
  },

  // 监听视频播放进度的回调
  handleTimeUpdate(event) {
    let videoTimeObj = {vid: event.currentTarget.id, currentTime: event.detail.currentTime};
    let {videoUpdateTime} = this.data;
    //判断记录播放时长的数组中是否有当前视频的播放记录
    let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid);
    if(videoItem) {
      videoItem.currentTime = event.detail.currentTime;
    } else { // 之前没有
      videoUpdateTime.push(videoTimeObj);
    }
    this.setData({
      videoUpdateTime
    })
  },

  // 视频播放结束时调用
  handleEnded(event) {
    // 移除记录播放时长数组中当前视频的对象
    let {videoUpdateTime} = this.data;
    videoUpdateTime.splice(videoUpdateTime.findIndex(item => item.vid === event.currentTarget.id),1);
    this.setData({
      videoUpdateTime
    })
  },

  // 自定义下拉刷新的回调
  handleRefresher() {
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 自定义上拉触底的回调
  handleToLower() {
    // console.log('scroll-view 上拉触底');
    // 数据分页： 1. 后端分页， 2. 前端分页
    // console.log('发送请求 || 在前端截取最新的数据 追加到视频列表的后方');
    // console.log('网易云音乐暂时没有提供分页的api');

    // 下拉刷新被触发改变isToLower
    this.setData({
      isToLower: true
    })
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 跳转至搜索页面
  toSearch() {
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },

  // 跳转至视频详情页
  playVideo(event) {
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.backgroundAudioManager.pause();
    const app = getApp();
    app.globalData.isPlay = false;
    let url = event.currentTarget.dataset.videovid
    let type = event.currentTarget.dataset.videotype
    wx.navigateTo({
      url: '/pages/videoPlayer/videoPlayer?videovid=' + url + '&videotype=' + type
    })
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
    if(from === 'button') {
      return {
        title: '来自button转发内容',
        page: '/pages/video/video'
      } 
    } else {
        return {
          title: '来自menu转发内容',
          page: '/pages/video/video'
      }
    }
  }
})