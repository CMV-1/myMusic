// pages/musicListSquare/musicListSquare.js

import request from '../../utils/request'

// 当前分类的tag名称
let tagName = '';
// 存放tagMusicList数据
let tagMusicListData = [];

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 当前显示的页面（共3个页面）
    showPage: 0,
    // 头部标签信息
    headTags: [],
    // 存放所有导航标签下的歌单
    tagMusicList: [],
    // 是否显示遮罩层
    isMaskShow: false,
    // 当前选择的标签索引
    tagIndex : 0,
    // 是否存在更多歌单数据
    isMore: true,
    // 存放所有的tags标签数据
    allTags: [],
    // 点击allTag中的标签的详情数据
    tagDetail: [],
    // 当前标签详情的名称
    tagName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    await this.getHeadTags()
    // 拿到标签导航数据里面的导航名
    tagName = this.data.headTags[this.data.tagIndex].name;
    this.getTagMusicList(tagName)
  },

  // 获取标签导航信息
  async getHeadTags() {
    let { tags } = await request('/playlist/hot');
    // 创建空数组为swiper占位
    let tagMusicList = [];
    tags.forEach(() => {
      tagMusicList.push([])
      // 避免浅拷贝共享地址
      tagMusicListData.push([])
    });
    this.setData({
      headTags: tags,
      tagMusicList
    })
  },

  // 获取该标签下的歌单
  async getTagMusicList(tag, offset) {
    // 开始加载数据遮罩层打开
    this.setData({
      isMaskShow: true
    })
    // offset不传入则置空
    if (offset == undefined) {
      offset = ''
    }
    // 发送请求 
    let { more, playlists } = await request('/top/playlist', { cat: tag, limit: 21, offset })
    // 拿到所有标签数据
    let tagMusicList = this.data.tagMusicList;
    // 请求数据添加到存放对应标签数据的数组内
    tagMusicList[this.data.tagIndex].push(...playlists);
    // 这里也用push 避免浅拷贝导致数据跟着tagMusicList一起被clearAttributes清空
    tagMusicListData[this.data.tagIndex].push(...playlists);
    // 更新数据并关闭遮罩层
    this.setData({
      isMore: more,
      tagMusicList,
      isMaskShow: false
    })
  },

  // 滑动触底时的回调
  // 查询更多musicList
  async reachBottom() {
    // 如果还有更多数据则再次发送请求
    if (this.data.isMore == true) {
      this.getTagMusicList(tagName, this.data.tagMusicList[this.data.tagIndex].length)
    } else {
      return;
    }
  },
  
  // 点击头部标签切换tag的回调
  changeTag(e) {
    // 去掉id前面的字符't'
    let index = e.currentTarget.id.slice(1);
    // 先判断用户是不是点击了当前所处的分类标签
    if (index != this.data.tagIndex) {
      this.clearAttributes()
      this.setData({
        tagIndex : index
      })
      // 更新tagName
      tagName = this.data.headTags[this.data.tagIndex].name;
    } else {
      return
    }
  },

  // 重置所有属性的函数
  clearAttributes() {
    // 拿到原数据
    let tagMusicList = this.data.tagMusicList;
    // 置空数组
    tagMusicList.forEach((item, index, arr) => {
      arr[index] = []
    })
    // 开启loading,更新数据
    this.setData({
      isMore: true,
      tagMusicList
    })
  },

  // 当滑动swiper时的回调
  changeCurrent(e) {
    // 先清空数据
    this.clearAttributes();
    // 滑块目前索引就是当前导航标签索引
    this.setData({
      tagIndex : e.detail.current
    })
    // 如果滑块没有数据就请求数据，有就追加到原有数据后面
    if (tagMusicListData[e.detail.current].length == 0) {
      tagName = this.data.headTags[e.detail.current].name;
      this.getTagMusicList(tagName)
    } else {
      let tagMusicList = this.data.tagMusicList;
      tagMusicList[e.detail.current].push(...tagMusicListData[e.detail.current])
      this.setData({
        tagMusicList,
      })
    }
  },

  // 跳转至tags列表
  toMoreTags() {
    // 显示第二个页面
    this.setData({
      showPage: 1
    })
    // 发送请求获取所有标签数据
    if (this.data.allTags.length == 0) {
      this.getAllTags()
    }
  },

  // 返回歌单广场
  goBackSquare() {
    this.setData({
      showPage: 0
    })
  },

  // 获取并加载全部标签数据
  async getAllTags() {
    let result = await request('/playlist/catlist');
    let allTags = [];
    // result.categories:
    // 0: "语种"
    // 1: "风格"
    // 2: "场景"
    // 3: "情感"
    // 4: "主题"
    for (var key in result.categories) {
      // allTags有5个成员，每个成员也是数组，数组的第一个成员存放标签所属分类的对象，第二个成员存放所属分类的所有标签的数组
      allTags.push([{ key: result.categories[key] }, []])
    }
    let index = 0
    allTags.forEach(item => {
      // result.sub是一个数组存放着所有标签数据，每个标签对象的category属性存放所属分类的类型（对应result.categories中的key值）
      result.sub.forEach(i => {
        if (i.category == index) {
          allTags[index][1].push(i)
        }
      })
      index++;
    })
    // 更新allTags
    this.setData({
      allTags
    })
  },

  // 点击所有标签中标签的回调
  async selectTag(e) {
    // 显示第三个页面,更新tagName
    this.setData({
      showPage: 2,
      tagName: e.currentTarget.dataset.tagname
    })
    // 请求标签详情数据
    this.getTagDetailData(this.data.tagName)
  },

  // 将获取tagDetail数据的函数进行封装
  async getTagDetailData(tag, offset) {
    if (offset == undefined) {
      offset = ''
    }
    let { playlists, more } = await request('/top/playlist', { cat: tag, limit: 21, offset });
    let tagDetail = this.data.tagDetail;
    tagDetail.push(...playlists);
    this.setData({
      isMore: more,
      tagDetail
    })
  },

  // 标签详情触底的回调
  tagDetailReachBottom() {
    // 数据还有更多继续请求
    if (this.data.isMore == true) {
      this.getTagDetailData(this.data.tagName, this.data.tagDetail.length)
    } else {
      return;
    }
  },

  // 从tagDeatil中返回allTags
  goBackTags() {
    // 返回第二个页面所以显示第二个页面
    this.setData({
      showPage: 1,
    })
    this.setData({
      tagName: '',
      tagDetail: [],
    })
  },

  // 跳转至musiclist页面
  toMusicList(e) {
    wx.navigateTo({
      url: '/pages/musicList/musicList?musiclistid=' + e.detail.currentTarget.dataset.musiclistid,
    });
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