// pages/musicList/musicList.js
import request from '../../utils/request'

let musicListId = ''; // 当前歌单的id
let trackIdsList = []; // 存放歌单歌曲的id 用于查询歌曲详情muisicInfo
let playingMusicList = []; // 存放查到的所有musicInfo
let pages = 0; // 当前列表的总页数
let currentPage = 0; // 当前所处的页数
let isListBelongToUser = true; // 当前歌单是否属于用户
let isLoadMoreTrigger = false; // 是否点击了加载更多


const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    barHeight: 0, // 当前机型的状态栏高度
    musicList: {}, // 歌单详情数据
    isScroll: false, // 是否允许scroll-view滚动
    isLoad: false, // 控制load组件是否显示
    isMore: true // 是否有更多数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 获取当前机型的状态栏高度
    wx.getSystemInfo({
      success: e => {
        this.setData({
          barHeight: e.statusBarHeight
        })
      }
    })

    // 清空trackIdsList
    trackIdsList = []
    pages = 0;
    currentPage = 0;
    playingMusicList = [];

    // 根据传过来的musiclistid查询歌单数据
    musicListId = options.musiclistid;
    let musicList = await request('/playlist/detail', { id: musicListId, s: 0 });
    // musicList.tracks存放着歌单前20条歌曲的信息（如果是用户创建歌单则是全部歌曲信息），musicList.trackIds则存放有全部歌曲的id（不管是不是用户创建歌单）
    musicList = musicList.playlist;

    // 保存tracksIds用于跳转到songDetail页面请求数据时
    musicList.trackIds.forEach(item => {
      trackIdsList.push(item.id)
    });
    // 将trackIdsList保存app.js的globalData中，在songDetail中就不需要重新请求了，节约时间，提升用户体验
    app.globalData.trackIdsList = trackIdsList;

    // 判断当前musicListId是否和storage中的musicListId是否相同
    if (wx.getStorageSync('musicListId') == options.musiclistid) {
      let playingMusicList = wx.getStorageSync('playingMusicList');
      musicList.tracks = playingMusicList;
    }

    // 取musicList中的tracks的前二十条，因为非该歌单的creator，最多只能拿20条tracks，其余的需要通过trackIds去查询详细信息
    // 大于20条表示此表单属于用户，已经获取过完整的数据，可拿到1000条tracks数据
    if (musicList.tracks.length > 20) {
      // 将tracks保存至playingMusicList中，减小setData的数据量 优化性能
      playingMusicList.push(...musicList.tracks);
      // 关闭加载更多按钮（如果是用户自己歌单不做加载更多按钮的功能）
      this.setData({
        isMore: false
      })
      // 判断数据是否大于50条
      if (playingMusicList.length > 50) { // 大于50条 对数据进行分页处理
        pages = Math.ceil(trackIdsList.length / 50);
        musicList.tracks = playingMusicList.slice(50 * currentPage, 50 * (currentPage + 1))
        currentPage++;
        this.setData({
          isLoad: true
        })
      } else { // 小于50条直接全部渲染至页面中关闭loading组件
        this.setData({
          isLoad: false
        })
      }
    } else {
      // 如果tracks长度小于20,说明不是此用户的歌单或是歌单本身小于20首
      // 歌单本身小于20首
      if (musicList.tracks.length == trackIdsList.length) {
        // 将tracks保存至playingMusicList中，减小setData的数据量 优化性能
        playingMusicList.push(...musicList.tracks);
        this.setData({
          isMore: false,
          isLoad: false
        })
      } else { // 保存前20首至playingMusicList
        isListBelongToUser = false;
        playingMusicList = musicList.tracks;
      }
    }
    
    // 更新歌单数据
    this.setData({
      musicList
    })
  },

  // 根据trackIds 查询歌单详情
  async getListByTrackIdsList() {
    if (trackIdsList.length > 100) {
      let index = Math.ceil(trackIdsList.length / 100);
      let i = 0;
      while (i != index) {
        let partParams = trackIdsList.slice(i * 100, (i + 1) * 100).join(',');
        let result = await request('/song/detail', { ids: partParams });
        result = result.songs;
        playingMusicList.push(...result);
        i++;
      }
    } else {
      // 截掉前面20条是因为前20条是用tracks的
      let params = trackIdsList.slice(0).join(',');
      let result = await request('/song/detail', { ids: params });
      result = result.songs;
      playingMusicList.push(...result);
    }
  },

  // 跳转至点击歌曲的详情页面
  async toSongDetail(event) {
    // 暂停播放音乐，提升用户体验
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.backgroundAudioManager.pause();
    let { song } = event.currentTarget.dataset;
    // 跳转至songDetail表示播放此歌单中的音乐，将歌单数据和歌单id存入storage
    wx.setStorageSync('playingMusicList', playingMusicList)
    wx.setStorageSync('musicListId', musicListId)
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + JSON.stringify(song) + '&type=musiclist'
    })
  },

  // 列表滚动控制
  handleTouchEnd(e) {
    if (e.changedTouches[0].pageY - e.changedTouches[0].clientY <= 70) {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      })
      if (this.data.isScroll == true) {
        this.setData({
          isScroll: false
        })
      }
    } else {
      wx.pageScrollTo({
        scrollTop: 99999,
        duration: 300
      })
      if (this.data.isScroll == false) {
        this.setData({
          isScroll: true
        })
      }
    }
  },

  // 列表滚动到底，加载更多数据
  async reachBottom(){
    // 先判断歌单是否属于用户
    if (isListBelongToUser == true) {
      if (currentPage < pages) {
        let data = playingMusicList.slice(50 * currentPage, 50 * (currentPage + 1))
        let musicList = this.data.musicList
        musicList.tracks.push(...data)
        this.setData({
          musicList: musicList
        })
        currentPage = currentPage + 1;
      } else {
        this.setData({
          isLoad: false
        })
        return;
      }
    }
    else {
      if (isLoadMoreTrigger == true) {
        if (playingMusicList.length > 50) {
          if (currentPage < pages) {
            let musicList = this.data.musicList
            let data = playingMusicList.slice(50 * currentPage, 50 * (currentPage + 1))
            musicList.tracks.push(...data)
            this.setData({
              musicList: musicList
            })
            currentPage++;
          } else {
            this.setData({
              isLoad: false
            })
          }
        } else {
          this.setData({
            isLoad: false,
          })
        }
      }
    }
  },

  // 点击加载更多的回调 
  async loadMore() {
    // 关闭加载更多按钮，开启loading组件
    this.setData({
      isLoad: true,
      isMore: false,
    })
    // 触发了加载更多按钮
    isLoadMoreTrigger = true;
    // 清空playingMusicList
    playingMusicList = [];
    // 由于不是用户创建歌单所以初始只能拿到20条数据，需要再次发送请求拿到更多数据
    await this.getListByTrackIdsList();
    let musicList = this.data.musicList;
    if (playingMusicList.length > 50) {
      // 大于50条 对数据进行分页处理
      pages = Math.ceil(trackIdsList.length / 50);
      currentPage = 1;
      // 之前的30条补上
      let data = playingMusicList.slice(20, 50);
      musicList.tracks.push(...data);
    } else {
      let data = playingMusicList.slice(20);
      musicList.tracks.push(...data);
    }
    this.setData({
      musicList,
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
    // 离开页面时，清空数据
    playingMusicList = [];
    pages = 0;
    currentPage = 0;
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