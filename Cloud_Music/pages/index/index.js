import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [], // 轮播图数据
    recommendList: [], // 推荐歌单
    topList: [], // 排行榜数据
    isStartShow: true // 是否开启首屏动画 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 页面一开始加载数据时把tabBar隐藏掉
    wx.hideTabBar()

    // 获取轮播图数据
    let bannerListData = await request("/banner", {type: 2});
    this.setData({
      bannerList: bannerListData.banners
    })

    // 获取推荐歌单数据
    let recommendListData = await request("/personalized");
    this.setData({
      recommendList: recommendListData.result
    })

    // 获取排行榜数据
    let index = 0;
    let resultArr = [];
    while (index < 5) {
      let topListData = await request('/top/list', {idx: index++});
      let topListItem = {name: topListData.playlist.name, tracks: topListData.playlist.tracks.slice(0, 3)};
      resultArr.push(topListItem);
      // 更新topList的状态值
      this.setData({
        topList: resultArr
      })
      // 页面数据加载结束关闭开屏动画并显示tabBar
      if (this.data.isStartShow == true) {
        this.setData({
          isStartShow: false
        })
        wx.showTabBar({
          animation: true
        })
      }
    }
  },

  // 跳转至搜索页面的回调
  toSearch() {
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },

  // 跳转至每日推荐页面的回调
  toRecommendSong() {
    wx.navigateTo({
      url: '/songPackage/pages/recommendSong/recommendSong',
    })
  },

  // 跳转至歌单广场页面的回调
  toMusicListSquare() {
    wx.navigateTo({
      url: '/pages/musicListSquare/musicListSquare',
    })
  },

  // 查看更多按钮跳转至推荐歌单页面
  getMoreRecommendMusicList() {
    wx.navigateTo({
      url: '/pages/recommendMusicList/recommendMusicList'
    })
  },

  // 首页推荐歌单跳转至音乐列表页面
  toMusicList(e) {
    wx.navigateTo({
      url: '/pages/musicList/musicList?musiclistid=' + e.currentTarget.dataset.musiclistid
    })
  },

  // 查看更多按钮跳转至排行榜页面的回调
  toRankList() {
    wx.navigateTo({
      url: '/pages/rankList/rankList'
    })
  },

  // 排行榜歌曲跳转至歌曲详情页面
  toSongDetail(event) {
    let musicId = event.currentTarget.id
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?musicId='+ musicId
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
  onShareAppMessage: function () {

  }
})