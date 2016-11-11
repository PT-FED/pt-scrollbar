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
        SCROLL_CONTAINER_HIDE = 'data-pt-scrollbar-hide',           // 容器 隐藏 attribute
        SCROLL_CONTAINER_SHOW = 'data-pt-scrollbar-show',           // 容器 显示 attribute
        SCROLL_VERTICAL_RAIL = 'pt-scroll-vertical-rail',           // 垂直滑轨 className
        SCROLL_VERTICAL_BAR = 'pt-scroll-vertical-bar',             // 垂直滑块 className
        SCROLL_HORIZONTAL_RAIL = 'pt-scroll-horizontal-rail',       // 水平滑轨 className
        SCROLL_HORIZONTAL_BAR = 'pt-scroll-horizontal-bar'          // 水平滑块 className

    // 默认设置
    var f = function () {};
    var setting = {
        step: 40,               // 每次滑动的步长, 默认20px
        className: '',          // 给外层容器添加自定义class, 方便定制换肤, 默认为''
        distance: 0,            // 距离边的间距, 建议采用css来控制间距, 默认 0
        height: 0,              // 设置容器的高度, 初始化滚动条, 建议css先预置高度, 插件自动计算高, 默认 0
        width: 0,               // 设置容器的宽度, 初始化滚动条, 建议css先预置宽度, 插件自动计算宽, 默认 0
    };

    // 缓存对象
    var cache = {
        count: 0,
        get: function (node) {
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
            document.addEventListener('DOMMouseScroll', this.wheel, false);
            document.addEventListener('mousewheel', this.wheel, false);
            this.isbind = true;
        },
        unbindEvent: function () {
            window.removeEventListener('resize', this.resize, false);
            document.removeEventListener('mousedown', this.mousedown, false);
            document.removeEventListener('mousemove', this.mousemove, false);
            document.removeEventListener('mouseup', this.mouseup, false);
            document.removeEventListener('DOMMouseScroll', this.wheel, false);
            this.isbind = false;
        },
        resize: function(event) {
            if (!utils.throttle(new Date().getTime(), THROTTLE_RESIZE_TIME)) return;
            for (var prop in cache) {
                var scroll = cache[prop];
                if (scroll instanceof Scroll) {
                    // 检测到内容区是否需要滚动条
                    if (view.testingScroll(scroll.content)) {
                        scroll.container.removeAttribute(SCROLL_CONTAINER_HIDE);
                        view.update(scroll);
                    } else {
                        scroll.container.setAttribute(SCROLL_CONTAINER_HIDE, SCROLL_CONTAINER_HIDE);
                    }
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
                self.offsetY = event.offsetY + view.getOffset(bar).top;
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
                var top = move * self.maxTop / self.maxMove;
                view.update(scroll, top);
            }
            // 优化: 重置滚动条
            var scroll = cache.get(event.target);
            if (!scroll) return;
            if (view.cacheHeight() !== scroll.content.offsetHeight) {
                // 这里可以优化定位 ???
                // scroll.content.scrollTop = 0;
                // 等比例的放大缩小
                // console.log(scroll.content.scrollTop);
                view.update(scroll);
            }
        },
        mouseup: function (event) {
            var self = handleEvent;
            if (self.isDrag) {
                self.isDrag = undefined;
                self.offsetY = undefined;
                self.maxMove = undefined;
                self.maxTop = undefined;
                self.scroll = null;
            }
        },
        wheel: function(event) {
            if (!utils.throttle(new Date().getTime(), THROTTLE_WHEEL_TIME)) return;
            var scroll = cache.get(event.target);
            if (!scroll) return;

            var delta = 0;
            if (event.wheelDelta) {
                delta = event.wheelDelta;
            } else if (event.detail !== 0) {
                delta = event.detail;
            }
            // chrome safari ie11 下 -1, 上 +1
            // chrome 120, safari 12,  ie11 只支持 event.wheelDelta, firefox 不支持 wheelDelta
            // console.log(event.wheelDelta, event.wheelDeltaX, event.wheelDeltaY); 
            // firefox detail, 下 +1, 上 -1,  除了firefox都是0
            // console.log(event.detail);
            
            var step = scroll.opt.step * (delta > 0 ? -1 : 1),
                content = scroll.content,
                top = (content.scrollTop += step),
                maxTop = content.scrollHeight - content.offsetHeight;
            if (0 < top && top < maxTop) {
                event.preventDefault();
            } else if ( top < 0 ) {
                top = 0;
            } else if ( maxTop < top ) {
                top = maxTop;
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
        // 优化方法, 缓存内容区的高度, 用于计算是否高度是否发生变化
        cacheHeight: function (offsetHeight) {
            var height = offsetHeight;
            this.cacheHeight = function(offsetHeight) {
                if (arguments.length === 0)
                    return height;
                height = offsetHeight;
            }
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
            // 优化: 缓存高度, 用于计算是否高度是否发生变化
            this.cacheHeight(content.offsetHeight);
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
                // 优化: 缓存高度, 用于计算是否高度是否发生变化
                this.cacheHeight(scroll.content.offsetHeight);
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
                contentScrollH = content.scrollHeight;

            railX = contentOffsetW - rail.offsetWidth - opt.distance;
            barX = contentOffsetW - bar.offsetWidth - opt.distance;
            
            barH = contentOffsetH / contentScrollH * contentOffsetH;
            if (barH < bar.offsetHeight)
                barH = bar.offsetHeight;
            
            barY = top / (contentScrollH - contentOffsetH) * (contentOffsetH - barH);

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
        }
    };

    function checkSelector(selector) {

    }

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
