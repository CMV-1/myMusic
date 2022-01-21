import request from '../../utils/request'
// import PubSub from 'pubsub-js'
let startY = 0; // 手指起始的坐标
let moveY = 0; // 手指移动的距离
let moveDistance = 0; // 手指移动的距离
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverTransform: "translateY(0)",
    coverTransition: "",
    userInfo: {}, // 用户信息
    recentPlayList: [], // 用户播放记录
    myFavoriteList: [], // 喜欢的音乐
    createdList: [], // 创建歌单
    collectedList: [], // 收藏歌单
    // index: 0 // 点击音乐的下标
    islogin:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 读取用户的基本信息
    let userInfo = wx.getStorageSync('userInfo');
    if(userInfo){
      // 更新userInfo的状态
      this.setData({
        userInfo: JSON.parse(userInfo),
        islogin:true
      })
      // 订阅来自songDetail页面发布的消息
      // PubSub.subscribe('switchType', (msg, type) => {
      //   let {recentPlayList, index} = this.data;
      //   if(type === 'pre') { // 上一首
      //     (index === 0) && (index = recentPlayList.length);
      //     index -= 1;
      //   } else { // 下一首
      //     (index === recentPlayList.length -1) && (index = -1);
      //     index += 1;
      //   }
      //   // 更新下标
      //   this.setData({ 
      //     index
      //   })
      //   let musicId = recentPlayList[index].id;
      //   // 将musicId回传给songDetail页面
      //   PubSub.publish('musicId', musicId);
      // });
    }
    // 如果与上次登录的账号相同则使用本地缓存数据渲染
    if (wx.getStorageSync('lastUserId') == wx.getStorageSync('userId') && wx.getStorageSync('userId') != '') {
      let recentPlayList = wx.getStorageSync('recentPlayList');
      let myFavoriteList = wx.getStorageSync('myFavoriteList');
      let createdList = wx.getStorageSync('createdList');
      let collectedList = wx.getStorageSync('collectedList');
      this.setData({
        recentPlayList,
        myFavoriteList,
        createdList,
        collectedList,
      })
    }
  },

  // 获取用户最近播放记录的功能函数
  async getUserRecentPlayList(userId) {
    let recentPlayListData = await request('/user/record', {uid: userId, type: 1});
    let recentPlayList = [];
    let originalPlayList = recentPlayListData.allData.splice(0, 10);
    for(let i = 0; i < originalPlayList.length; i++) {
      recentPlayList.push(originalPlayList[i].song);
    }
    this.setData({
      recentPlayList
    })
    wx.setStorageSync('recentPlayList', recentPlayList)
  },

  // 获取并处理用户歌单的功能函数
  async getUserPlayList() {
    let userPlayList = await request('/user/playlist', { uid: this.data.userInfo.userId })
    userPlayList = userPlayList.playlist
    // 对获取到的数据进行分类处理
    let myFavoriteList = [];
    let createdList = [];
    let collectedList = [];

    myFavoriteList.push(userPlayList[0])
    userPlayList = userPlayList.splice(1);
    // console.log(userPlayList);
    userPlayList.forEach(item => {
      if (item.subscribed == true) {
        return
      }
      createdList.push(item)
    });
    userPlayList = userPlayList.splice(createdList.length);
    userPlayList.forEach(item => {
      collectedList.push(item)
    });

    this.setData({
      myFavoriteList,
      createdList,
      collectedList
    })
    wx.setStorageSync('myFavoriteList', myFavoriteList)
    wx.setStorageSync('createdList', createdList)
    wx.setStorageSync('collectedList', collectedList)
    wx.setStorageSync('lastUserId', this.data.userInfo.userId)
  },

  // 下拉动画效果
  handleTouchStart(event) {
    this.setData({
      coverTransition: ""
    })
    startY = event.touches[0].clientY;
  },

  handleTouchMove(event) {
    moveY = event.touches[0].clientY;
    moveDistance = moveY - startY;
    if(moveDistance <= 0) {
      return;
    }
    if(moveDistance >= 80) {
      moveDistance = 80;
    }
    this.setData({
      coverTransform: `translateY(${moveDistance}rpx)`
    })
  },

  handleTouchEnd() {
    this.setData({
      coverTransform: `translateY(0rpx)`,
      coverTransition: "transition 1s linear"
    })
  },

  // 跳转至登录页面
  toLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },

  // 最近播放歌曲跳转至songDetail页面
  toSongDetail(event) {
    let {song} = event.currentTarget.dataset;
    // let {index} = event.currentTarget.dataset;
    // this.setData({
    //   index
    // });
    wx.setStorageSync('playingMusicList', this.data.recentPlayList);
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.id
    })
  },

  // 跳转至喜欢的音乐列表页面
  toMusicList(e) {
    wx.navigateTo({
      url: '/pages/musicList/musicList?musiclistid=' + e.currentTarget.dataset.musiclistid
    })
  },

  //退出登录
  async logout(){
   //服务端退出登录状态
   let status = await request('/logout');
   console.log(status)
   //删除客户端信息
   wx.removeStorageSync('userInfo')
   this.setData({
     userInfo: {},
     islogin:false
   })
   wx.navigateTo({
     url: '/pages/login/login',
   })
   wx.showToast({
     title: '退出登录',
     icon: 'success'
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
    if (this.data.userInfo.userId) {
      this.getUserPlayList();
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
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
    if (this.data.userInfo.userId) {
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})