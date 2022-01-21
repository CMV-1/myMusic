// components/NavHeader/NavHeader.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: '我是默认值title'
    },
    nav: {
      type: String,
      value: '我是默认值nav'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    getMore() {
      this.triggerEvent('getMore');
    }
  }
})
