import request from '../../utils/request';
import moment from 'moment';

// time: 分页参数,取上一页最后一项的 time 获取下一页数据
let floorCommentTime = '';
// 当前评论的id
let commentId = '';
// 当前资源类型
let resourceTypeNum = 0;

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 资源id
    musicId: {
      type: String,
      value: '',
    },
    // 评论列表占屏比例
    commentListHeight: {
      type: String,
      value: '100vh',
    },
    // 资源类型
    resourceType: {
      type: String,
      value: 'music'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 评论列表
    commentList: [],
    // 当前评论页数
    page: 1,
    // 是否显示loading组件
    isLoad: true,
    // 评论总条数
    total: 0,
    // 是否显示楼层评论列表
    isFloorCommentListShow: false,
    // 是否显示楼层评论的loading组件
    isFloorLoad: true,
    // 楼层评论数据
    floorComment: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 获取评论列表的功能函数
    async getCommentList(id, page) {
      let commentList = this.data.commentList;
      let commentData = await request('/comment/new', { id, pageSize: 200, pageNo: page, sortType: 1, type: resourceTypeNum }, 1);
      // 先给total赋值
      // 上拉触底时total不为0即进来时已经更新所以此时不用再更新,如果评论数为空也不需要更新用默认值即可
      if (this.data.total == 0 && commentData.data.totalCount != 0) {
        this.setData({
          total: commentData.data.totalCount
        })
      }
      // 判断评论是否为0，为0则此时评论数为空或者已经全部加载，关闭Load组件并return
      if (commentData.data.comments.length == 0) {
        this.setData({
          isLoad: false
        })
        return;
      }
      // 格式请求到的评论数据的评论时间
      commentData.data.comments.forEach(async item => {
        item.time = moment(item.time).format('yyyy年M月Do');
      })
      // 更新评论列表
      commentList.push(...commentData.data.comments)
      this.setData({
        commentList
      })
    },

    // 评论列表触底时触发的事件
    reachBottom() {
      this.setData({
        page: this.data.page + 1
      })
      this.getCommentList(this.data.musicId, this.data.page)
    },

    // 点击查看回复显示楼层评论列表
    async showList(e) {
      this.setData({
        isFloorCommentListShow: true, // 先滑出楼层评论框
        isFloorLoad: true // 开启loading组件 
      })
      // 获取到当前视频id作为请求参数
      commentId = e.currentTarget.dataset.commentid;
      // 发送请求获取回复楼层数据
      let floorComment = await request('/comment/floor', { parentCommentId: commentId, id: this.data.musicId, limit: 10, type: resourceTypeNum }, 1)
      floorComment = floorComment.data;
      // 回复数多于10条保存此页最后一条数据的time属性
      if (floorComment.comments.length == 10) {
        // 在处理时间前先保存，在上拉再次触发请求时作为time参数传入请求地址
        floorCommentTime = floorComment.comments[floorComment.comments.length - 1].time;
      } else {
        // 回复数少于10条即只有一页数据就关闭loading组件
        this.setData({
          isFloorLoad: false
        })
      }
      // 对时间进行格式化处理，先处理本人评论信息，后处理回复信息
      floorComment.ownerComment.time = moment(floorComment.ownerComment.time).format('yyyy年M月Do');
      floorComment.comments.forEach(item => {
        item.time = moment(item.time).format('yyyy年M月Do');
      })
      // 更新楼层数据
      this.setData({
        floorComment:floorComment
      })
    },

    // 楼层评论滑动到底部
    async reachFloorBottom() {
      // foorCommentTime等于空则说明数据少于10条，结束事件回调
      if (floorCommentTime == '') {
        return
      }
      // 先拿到上一次请求到的数据
      let floorComment = this.data.floorComment;
      // 再次发送请求，把floorCommentTime作为time请求参数传入
      let result = await request('/comment/floor', { parentCommentId: commentId, id: this.data.musicId, limit: 10, type: resourceTypeNum, time: floorCommentTime }, 1)
      // 此时数据刚好为10条，关闭loading组件
      if (result.data.comments.length == 0) {
        this.setData({
          isFloorLoad: false
        })
        return
      }
      // 拿到上拉触底数据
      result = result.data.comments;
      // 再次在处理时间前保存floorCommentTime用于下次请求的time参数
      floorCommentTime = result[result.length - 1].time;
      // 格式化时间
      result.forEach(item => {
        item.time = moment(item.time).format('yyyy年M月Do');
      })
      // 追加到原来楼层的回复数据中
      floorComment.comments.push(...result)
      // 再次更新楼层回复数据
      this.setData({
        floorComment
      })
    },

    // 点击遮罩层隐藏楼层评论列表
    hideList() {
      this.setData({
        isFloorCommentListShow: false, // 隐藏楼层
        floorComment: {}, // 清空楼层回复信息
      })
    }
  },

  lifetimes: {
    ready: function () {
      // 在组件实例进入页面节点树时执行
      // 判断资源类型
      if (this.data.resourceType == 'music') {
        resourceTypeNum = 0
      } else if (this.data.resourceType == 'video') {
        resourceTypeNum = 5
      } else if (this.data.resourceType == 'mv') {
        resourceTypeNum = 1
      }
      // 获取评论数据
      this.getCommentList(this.data.musicId, this.data.page)
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },
})
