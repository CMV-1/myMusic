import request from '../../utils/request'
let isSend = false; // 用于函数节流
let isReachBottom = false; // 是否上拉触底
let searchData =  [[], [], []] 

Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '', // placeholder的内容 
    recommendSearch: [], //推荐搜索数据
    hotList: [], // 热搜榜数据
    searchContent: '', // 用户输入的表单项数据
    searchList: [], // 关键字模糊匹配的数据
    historyList: [], // 搜索历史记录 
    cursor: true, // 表单光标变化的标识
    searchResult: [[], [], []], // 查询结果
    hasMore: true, // 是否还有更多结果
    state: 0, // 搜索页面所处的阶段
    searchType: 0, // 搜索类型
    left: 12, // 选择类型时的效果水平位置
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取初始化数据
    this.getInitData();
    // 获取历史记录
    this.getSearchHistory();
  },

  // 获取初始化的数据
  async getInitData() {
    let placeholderData = await request('/search/default');
    let hotListData = await request('/search/hot/detail');
    let recommendSearchData = await request('/personalized/newsong');
    this.setData({
      placeholderContent: placeholderData.data.showKeyword,
      hotList: hotListData.data,
      recommendSearch : recommendSearchData.result.slice(0,4)
    })
  },

  // 获取本地历史记录的功能函数
  getSearchHistory() {
    let historyList = wx.getStorageSync('searchHistory');
    if(historyList) {
      this.setData({
        historyList
      })
    }
  },

  // 表单光标发生变化的回调
  handlePlaceholderContent() {
    this.setData({
      cursor: !this.data.cursor
    })
  },

  // 清空搜索内容
  clearSearchContent() {
    this.setData({
      state: 0,
      searchContent: '',
      searchList: [],
      searchResult: [[], [], []]    
    })
  },

  // 表单项内容发生改变的回调
  handleInputChange(event){
    // 更新searchContent的状态数据
    this.setData({
      searchContent: event.detail.value
    })
    if(isSend){
      return
    }
    isSend = true;
    if(event.detail.value.trim()) {
      this.getSearchList(event.detail.value.trim());
      this.setData({
        state: 0
      })
    }
    // 函数节流
    setTimeout(() => {
      isSend = false;
    }, 500) 
    // 当搜索内容被退格为空清空searchList
    if(!event.detail.value.trim()) {
      this.setData({
        searchList: [],
        state: 0  
      })
    }
  },

  // 获取搜索关键词的功能函数
  async getSearchList(searchContent) {
    if(!this.data.searchContent) {
      this.setData({
        searchList: []
      })
      return;
    }
    // 发送请求获取关键字模糊匹配数据
    let suggest = await request('/search/suggest', { keywords: searchContent, type: 'mobile' })
    this.setData({
      searchList: suggest.result.allMatch
    })
  },

  // 按回车确认搜索触发
  async confirmSearch(e) {
    searchData =  [[], [], []];
    let searchContent = e.detail.value;
    // 如果搜索内容为空，直接搜索默认搜索内容
    if (searchContent.trim() == '') {
      searchContent = this.data.placeholderContent;
    }
    this.setData({
      searchContent,
    })
    await this.getSearch(searchContent.trim());
  },

  // 获取搜索结果的功能函数
  async getSearch(searchContent,offset) {
    // 切换到页面2展示搜索结果
    this.setData({
      state: 1
    })
    // offset不传入则置空
    if (offset == undefined) {
      offset = 0
    }
    // 如果发送请求时不是被上拉触底触发的就清空搜索结果，这样上一次搜索的结果就不会与下一次的结果堆成一起
    if(!isReachBottom) {
      this.setData({
        searchResult: [[], [], []]
      })
    } else {
      isReachBottom = false;
    }
    // 当type为 1是单曲   为 1000是歌单   为 1014是视频
    // 先初始化为1
    let type = 1;
    // 当滑块滑动或者点击类型标题时searchType会被切换
    // 拿到当前的搜索类型对其进行判断
    let searchType = this.data.searchType;
    if (searchType == 0) {
      type = 1
    } else if (searchType == 1) {
      type = 1000
    } else if (searchType == 2) {
      type = 1014
    }
    let searchResult = this.data.searchResult
    let searchResultData = await request('/search', { keywords: searchContent, limit: 20, offset, type } )
    // 判断是否还有更多结果
    if (searchResultData.result.hasMore == false) {
      this.setData({
        hasMore: false
      })
    }
    // 根据搜索类型归入到搜索结果的数组中
    if (searchType == 0) {
      searchResultData = searchResultData.result.songs
    } else if (searchType == 1) {
      searchResultData = searchResultData.result.playlists
    } else {
      searchResultData = searchResultData.result.videos
    }
    searchResult[searchType].push(...searchResultData);
    searchData[searchType].push(...searchResultData);
    this.setData({
      searchResult,
    })
    // 添加搜索历史
    this.changeSearchHistory(searchContent)
  },

  // 对历史搜索进行添加的回调 
  changeSearchHistory(searchContent) {
    let historyList = this.data.historyList
    // 先判断列表中有没有相同的搜索
    if (!historyList.some(item => { return item == searchContent })) {
      historyList.unshift(searchContent)
      wx.setStorageSync('searchHistory', historyList);
      this.setData({
        historyList
      })
    }
    return;
  },

  // 通过直接点击类型标题改变搜索类型的回调
  changeTypeByTap(e) {
    let id = e.currentTarget.id;
    if (id == 0) {
      this.setData({
        left: 12,
        searchType: id
      })
    } else if (id == 1) {
      this.setData({
        left: 45,
        searchType: id
      })
    } else {
      this.setData({
        left: 79,
        searchType: id
      })
    }
  },

  // 搜索结果滑动切换搜索类型时 
  handleChangeType(e) {
    let left = 0;
    e.detail.current为滑块当前索引
    if (e.detail.current == 0) {
      left = 12
    } else if (e.detail.current == 1) {
      left = 45
    } else {
      left = 79
    }
    this.setData({
      searchType: e.detail.current,
      left,
      hasMore: true
    })
    // 如果滑块没有数据就请求数据，有就追加到原有数据后面
    if (searchData[e.detail.current].length == 0) {
      this.getSearch(this.data.searchContent.trim());
    } else {
      let searchResult = [[], [], []];
      searchResult[e.detail.current].push(...searchData[e.detail.current])
      this.setData({
        searchResult
      })
    }
  },

  // 查询结果列表滑动到底触发
  handleResultListBottom() {
    isReachBottom = true;
    if (this.data.hasMore) {
      this.getSearch(this.data.searchContent.trim(),searchData[this.data.searchType].length)
    }
  },

  // 点击历史搜索item的回调 
  async tapSearchHistory(e) {
    searchData = [[], [], []];
    this.setData({
      searchContent: e.currentTarget.dataset.searchword
    })
    await this.getSearch(e.currentTarget.dataset.searchword)
  },

  // 点击推荐搜索的item触发
  async tapRecommendSearch(e) {
    searchData = [[], [], []];
    this.setData({
      searchContent: e.currentTarget.dataset.searchname
    })
    await this.getSearch(e.currentTarget.dataset.searchname)
  },

  // 直接点击热搜榜的item触发
  async tapHotSearch(e) {
    searchData = [[], [], []];
    this.setData({
      searchContent: e.currentTarget.dataset.searchword
    })
    await this.getSearch(e.currentTarget.dataset.searchword)
  },

  // 点击模糊搜索关键字的回调
  tapSearchListItem(e) {
    searchData = [[], [], []]; 
    this.setData({
      searchContent: e.currentTarget.dataset.keyword
    })
    this.getSearch(e.currentTarget.dataset.keyword)
  },

  // 点击跳转至songDetail
  toSongDetail(e) {
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + e.currentTarget.dataset.musicid + '&type=searchList',
    });
  },

  // 跳转至音乐列表页面
  toMusicList(e) {
    wx.navigateTo({
      url: '/pages/musicList/musicList?musiclistid=' + e.currentTarget.dataset.musiclistid
    })
  },

  // 点击视频事件
  playVideo(e) {
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.backgroundAudioManager.pause();
    const app = getApp();
    app.globalData.isPlay = false;
    let url = e.currentTarget.dataset.videovid;
    let type = e.currentTarget.dataset.videotype;
    // 跳转至视频详情
    wx.navigateTo({
      url: '/pages/videoPlayer/videoPlayer?videovid=' + url + '&videotype=' + type
    })
  },

  // 删除搜索历史记录
  deleteSearchHistory() {
    wx.showModal({
      content: '确认删除吗？',
      success: (res) => {
        if(res.confirm) {
          // 清空data中historyList
          this.setData({
            historyList: []
          });
          // 移除本地的历史记录缓存
          wx.removeStorageSync('searchHistory');
        }
      }
    })
  },

  // 返回按钮
  backToVideo() {
    wx.navigateBack({
      delta: 1,
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