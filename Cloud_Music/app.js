App({
  globalData: {
    isMusicPlay: false, // 是否有音乐在播放
    musicId: '', // 音乐Id
    musicListId: '', // 当前播放歌单id
    playingMusicList: [], // 当前播放歌单
    playingMusicIndex: 0,  // 当前播放歌曲在歌单中的索引
    likeList: [], // 喜欢的歌曲列表
    trackIdsList: [] // 存放在musicList中请求到的歌单列表歌曲的id
  },

  // songDetail在退出前调用 以获得songDetail中的数据
  getExitInfo() {
    // 获取songDetail保存的exitInfo数组
    if (wx.getStorageSync('exitInfo')) {
        let exitInfo = wx.getStorageSync('exitInfo');
        let musicListId = exitInfo[0];
        let isPlay = exitInfo[1];
        let playingMusicIndex = exitInfo[2];
        let playingMusicList = exitInfo[3];
        this.setData({
            musicListId,
            isPlay,
            playingMusicIndex,
            playingMusicList,
        })
    }
  },

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    
  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {
    
  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {
    
  }
})

