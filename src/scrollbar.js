'use strict';
/**
 * Copyright (c) 2016 tm-roamer
 * https://github.com/PT-FED/pt-scrollbar
 * version: 1.0.0
 * 描述: 模仿浏览器滚动条的插件
 * 原则和思路:  不依赖任何框架和类库, 低侵入实现.
 * 兼容性: ie11+
 * 支持: requirejs和commonjs和seajs
 */
;(function (parent, fun) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = fun();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(fun);
    } else if (typeof define === 'function' && typeof define.cmd === 'object') {
        define(fun);
    } else {
        parent.scrollbar = fun().instance;
    }
})(window.pt || window, function (scrollbar) {

    // 常量
    var THROTTLE_RESIZE_TIME = 15,      // resize的节流函数的时间间隔, 单位ms, FPS = 1000 / x
        THROTTLE_WHEEL_TIME = 10,       // wheel的节流函数的时间间隔, 单位ms, FPS = 1000 / x
        SCROLL_CONTAINER_INDEX = 'pt-scrollbar-container-index',    // 容器自定义属性
        SCROLL_CONTAINER = 'pt-scrollbar-container',                // 容器 className
        SCROLL_CONTAINER_HOVER = 'pt-scrollbar-hover',              // 容器 悬停 attribute
        SCROLL_CONTAINER_HIDE = 'pt-scrollbar-hide',                // 容器 隐藏 attribute
        SCROLL_VERTICAL_RAIL = 'pt-scroll-vertical-rail',           // 垂直滑轨 className
        SCROLL_VERTICAL_BAR = 'pt-scroll-vertical-bar',             // 垂直滑块 className
        SCROLL_HORIZONTAL_RAIL = 'pt-scroll-horizontal-rail',       // 水平滑轨 className
        SCROLL_HORIZONTAL_BAR = 'pt-scroll-horizontal-bar'          // 水平滑块 className

    // 默认设置
    var f = function () {};
    var setting = {
        step: 20,               // 每次滑动的步长, 默认20px
        className: '',          // 给外层容器添加自定义class, 方便定制换肤, 默认为''
        distance: 0,            // 距离边的间距, 建议采用css来控制间距, 默认 0
        minHeight: 40,          // 垂直滚动条滑块的最小高度, 默认40px
        minWidth: 40,           // 水平滚动条滑块的最小宽度, 默认40px
        allowScroll: true,      // 滚到内容区边界, 是否允许触发其他的滚动事件, 默认允许 true
    };

    // 缓存对象
    var cache = {
        count: 0,
        get: function (node) {
            if (!node) return undefined;
            var content = view.searchUp(node, SCROLL_CONTAINER_INDEX);
            if(!content) return undefined;
            return cache[content.getAttribute(SCROLL_CONTAINER_INDEX)]
        }
    };

    // 工具方法
    var utils = {
        // 属性拷贝
        extend: function (def, opt) {
            if (!opt) return def;
            var conf = {};
            for (var attr in def) {
                if (typeof opt[attr] !== "undefined") {
                    conf[attr] = opt[attr];
                } else {
                    conf[attr] = def[attr];
                }
            }
            return conf;
        },
        // 节流函数
        throttle: function (now, interval) {
            var time = new Date().getTime();
            utils.throttle = function (now) {
                if (now - time > interval) {
                    time = now;
                    return true;
                }
                return false;
            };
            utils.throttle(now, interval);
        }
    };

    // 事件处理对象
    var handleEvent = {
        isDrag: false,              // 是否正在拖拽
        isHover: false,             // 是否悬停
        dragElement: null,          // 拖拽的滑块
        init: function (isbind) {
            if (this.isbind) return;
            this.isbind = isbind;
            this.unbindEvent();
            this.bindEvent();
        },
        bindEvent: function () {
            window.addEventListener('resize', this.resize, false);
            document.addEventListener('mousedown', this.mousedown, false);
            document.addEventListener('mousemove', this.mousemove, false);
            document.addEventListener('mouseup', this.mouseup, false);
            document.addEventListener('mouseover', this.mouseover, false);
            document.addEventListener('mouseout', this.mouseout, false);
            document.addEventListener('DOMMouseScroll', this.wheelBubble, false);
            document.addEventListener('mousewheel', this.wheelBubble, false);
            this.isbind = true;
        },
        unbindEvent: function () {
            window.removeEventListener('resize', this.resize, false);
            document.removeEventListener('mousedown', this.mousedown, false);
            document.removeEventListener('mousemove', this.mousemove, false);
            document.removeEventListener('mouseup', this.mouseup, false);
            document.removeEventListener('mouseover', this.mouseover, false);
            document.removeEventListener('mouseout', this.mouseout, false);
            document.removeEventListener('DOMMouseScroll', this.wheelBubble, false);
            document.removeEventListener('mousewheel', this.wheelBubble, false);
            this.isbind = false;
        },
        resize: function(event) {
            if (!utils.throttle(new Date().getTime(), THROTTLE_RESIZE_TIME)) return;
            for (var prop in cache) {
                var scroll = cache[prop];
                if (scroll instanceof Scroll) {
                    view.update(scroll, scroll.content.scrollTop);
                }
            }
        },
        mousedown: function (event) {
            var self = handleEvent,
                target = event.target,         
                className = target.className;
            if (className === SCROLL_VERTICAL_BAR) {
                var scroll = cache[target.getAttribute(SCROLL_CONTAINER_INDEX)],
                    bar = scroll.bar,
                    content = scroll.content;
                if (!scroll) return;
                self.isDrag = true;
                self.scroll = scroll;
                self.offsetY = event.offsetY + view.getOffset(content).top;
                self.maxMove = content.offsetHeight - bar.offsetHeight;
                self.maxTop = content.scrollHeight - content.offsetHeight;
            }
        },
        mousemove: function (event) {
            // 拖拽滑块
            var self = handleEvent;
            if (self.isDrag) {
                // 将pageY转换成top
                var scroll = self.scroll,
                    bar = scroll.bar,
                    move = event.pageY - self.offsetY;
                move < 0 && (move = 0);
                self.maxMove < move && (move = self.maxMove);
                // 优化, 缓存top, 用于定位
                var top = self.top = move * self.maxTop / self.maxMove;
                view.update(scroll, top);
                scroll.content.scrollTop = top;
            }
        },
        mouseup: function (event) {
            var self = handleEvent;
            if (self.isDrag) {
                self.isDrag = false;
                self.offsetY = 0;
                self.maxMove = 0;
                self.maxTop = 0;
                if (self.isHover)
                    self.mouseout();
                self.scroll = null;
            }
        },
        mouseover: function(event) {
            // 优化: 重置滚动条
            var self = handleEvent,
                scroll = cache.get(event.target);
            if (!scroll) return;
            self.scroll = scroll;
            // 设置悬停
            self.isHover = true;
            scroll.container.setAttribute(SCROLL_CONTAINER_HOVER, SCROLL_CONTAINER_HOVER);
            // 更新滚动条
            view.update(scroll, scroll.content.scrollTop);
        },
        mouseout: function(event) {
            var self = handleEvent;
            // 设置悬停
            if (self.isHover && self.isDrag === false) {
                self.isHover = false;
                if (!self.scroll) return;
                self.scroll.container.removeAttribute(SCROLL_CONTAINER_HOVER);
                self.scroll = null;
            }
        },
        // 优化: 滚动条嵌套情况需要冒泡
        wheelBubble: function(event) {
            var arr = [],
                self = handleEvent;
            // 初始冒泡队列
            var ele = view.searchUp(event.target, SCROLL_CONTAINER_INDEX);
            if (!ele) return;
            while (ele) {
                arr.push({
                    fun: self.wheel,
                    evt: event,
                    scroll: cache[ele.getAttribute(SCROLL_CONTAINER_INDEX)]
                });
                ele = view.searchUp(ele.parentNode, SCROLL_CONTAINER_INDEX);
            }
            // 执行冒泡队列
            var bubble, allowScroll;
            for (var i = 0, len = arr.length; i < len; i++) {
                bubble = arr[i];
                allowScroll = bubble.scroll.opt.allowScroll;
                bubble.fun(bubble.evt, bubble.scroll, allowScroll);
                // 如果配置false, 则阻止冒泡
                if (allowScroll === false && i === 0) return;
            }
        },
        wheel: function(event, scroll, allowScroll) {
            if (!scroll) return;

            var delta = 0;
            if (event.wheelDelta) { delta = -event.wheelDelta/120; }
            if (event.detail) { delta = event.detail / 3; }
            
            var step = scroll.opt.step * delta,
                content = scroll.content,
                top = (content.scrollTop += step),
                maxTop = content.scrollHeight - content.offsetHeight;

            if (0 < top && top < maxTop) {
                event.preventDefault();
            } else {
                !allowScroll && event.preventDefault();    
            }
            view.update(scroll, top);
        }
    };

    // 展示对象, 操作dom
    var view = {
        searchUp: function (node, attrName) {
            if (node === handleEvent.body || node === document) 
                return undefined;
            if (node.getAttribute(attrName))
                return node;
            else
                return this.searchUp(node.parentNode, attrName);
        },
        getOffset: function(node, offset) {
            offset = offset ? offset : {top: 0, left: 0};
            if (node === null || node === document) return offset;
                offset.top += node.offsetTop;
                offset.left += node.offsetLeft;
            return this.getOffset(node.offsetParent, offset);
        },
        // 测试是否适合启用滚动条插件
        testingScroll: function(node) {
            return !(node.scrollHeight === node.clientHeight);
        },
        create: function (content, opt) {
            var container = document.createElement("div"),
                rail = document.createElement("div"),
                bar = document.createElement("div");
            container.className = SCROLL_CONTAINER + ' ' + opt.className;
            rail.className = SCROLL_VERTICAL_RAIL;
            bar.className = SCROLL_VERTICAL_BAR;
            bar.setAttribute(SCROLL_CONTAINER_INDEX, opt.index);
            container.appendChild(rail);
            container.appendChild(bar);
            content.parentNode.insertBefore(container, content);
            container.appendChild(content);
            view.render(container, content, rail, bar, opt);
            return {
                container: container,
                rail: rail,
                bar: bar
            };
        },
        update: function (scroll, top) {
            // 检测到内容区是否需要滚动条
            if (this.testingScroll(scroll.content)) {
                scroll.container.removeAttribute(SCROLL_CONTAINER_HIDE);
                this.render(scroll.container, scroll.content, 
                    scroll.rail, scroll.bar, scroll.opt, top);
            } else {
                scroll.container.setAttribute(SCROLL_CONTAINER_HIDE, SCROLL_CONTAINER_HIDE);
            }
        },
        remove: function (container, content, rail, bar) {
            var parentNode = container.parentNode;
            content.removeAttribute(SCROLL_CONTAINER_INDEX);
            parentNode.insertBefore(content, container);
            parentNode.removeChild(container);
        },
        render: function(container, content, rail, bar, opt, top) {
            var top = top || 0,
                railX = 0, 
                railY = 0,
                barX = 0,
                barY = 0, 
                barH = 0,
                contentOffsetW = content.offsetWidth,
                contentOffsetH = content.offsetHeight,
                contentScrollH = content.scrollHeight,
                maxTop = contentScrollH - contentOffsetH;

            railX = contentOffsetW - rail.offsetWidth - opt.distance;
            barX = contentOffsetW - bar.offsetWidth - opt.distance;
            
            barH = contentOffsetH / contentScrollH * contentOffsetH;
            // 限制最小高度
            if (barH < opt.minHeight) barH = opt.minHeight;
            // 过滤值域
            if (top < 0) top = 0;
            if (top > maxTop) top = maxTop;
            
            barY = top / (maxTop) * (contentOffsetH - barH);

            rail.style.cssText = ';left:' + railX + 'px;top:' + railY + 'px;';
            bar.style.cssText = ';left:' + barX + 'px;top:' + barY + 'px;' + 'height:'+barH+'px;';
        }
    };

    // 滚动条对象
    function Scroll(content, options, index) {
        this.opt = utils.extend(setting, options);
        this.opt.index = index;
        this.content = content;
        var map = view.create(content, this.opt);
        this.container = map.container;
        this.rail = map.rail;
        this.bar = map.bar;
    }

    Scroll.prototype = {
        constructor: Scroll,
        destroy: function () {
            view.remove(this.container, this.content, this.rail, this.bar);
            this.opt = undefined;
            this.content = undefined;
            this.container = undefined;
            this.rail = undefined;
            this.bar = undefined;
            return this;
        },
        // 更新配置, 实时生效
        load: function (options) {
            this.opt = utils.extend(setting, options);
        },
        update: function(top) {
            top = top || this.content.scrollTop;
            view.update(this, top);
            this.content.scrollTop = top;
            return this;
        }
    };

    // 构建实例
    function instance(selector, options) {
        var content = document.querySelector(selector);
        if (!content) 
            throw new Error('scrollbar selector is invalid');
        // 如果检测到内容区不需要滚动条, 则不创建
        if (!view.testingScroll(content))
            return;
        // 初始化监听
        handleEvent.init(true);
        // 设置编号
        var index = content.getAttribute(SCROLL_CONTAINER_INDEX);
        // 如果存在直接返回
        if (index) return cache[index];
        index = ++cache.count;
        content.setAttribute(SCROLL_CONTAINER_INDEX, index);
        return cache[index] = new Scroll(content, options, index);
    }

    // 销毁实例
    function destroy(scroll) {
        if (!scroll) return;
        delete cache[scroll.opt.index];
        scroll.destroy();
        scroll = null;
    }

    scrollbar = {
        version: "1.0.0",
        instance: instance,
        destroy: destroy
    };

    return scrollbar;
});
