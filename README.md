# pt-scrollbar
scrollbar.js is a plugin for Browser ScrollBar, 一个轻量简单的浏览器滚动条插件

# 简介

	一个简单轻量的滚动条插件

# 支持场景

	场景1: 内容区特别长的时候, 滚动条变的特别小, 希望滑块有最小高度, 支持
	场景2: 滚动一下的滚动距离设置. 滚动快慢, 支持
	场景3: 灵活根据需求设置滚动条的位置, 支持
	场景4: 不能根据内容区的长短自动消失, 支持
	场景5: 插件A太大, 需要依赖ul li, 添dom层级才能使用, 添加特定的class, 使用麻烦, 支持
	场景6: 鼠标悬停显示滚动条, 离开隐藏滚动条, 支持
	场景7: 滚动条的注销事件, 可以删除掉, 可以重置, 支持
	场景8: tab切换的时候, 滚动到任意地方, 切换tab, 需要回到顶部, 或保留之前的定位位置, resize的需要定位, 支持
	场景9: 滚动条触发全局滚动, 有些需要不触发全局滚动, 滚动条的嵌套的问题, 支持
	场景10:  支持同时出现垂直和水平的滚动条

# 使用说明

	window.scrollbar.instance("#I_need_a_scroll_bar");

# 未来补充:

	支持滚动条嵌套情况, 暂不支持.

# 版本变化

##v1.0.1
	bug: 滑块hover离开之后就消失了, 但是点击拖拽的mouseup并没有开始触发, 体验不好, 修复
	bug: 滑动的step步长顺滑度优化,  修复

### 版权
  MIT
