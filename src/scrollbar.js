'use strict';
/**
 * Copyright (c) 2016 tm-roamer
 * https://github.com/PT-FED/pt-scrollbar
 * version: 1.0.0
 * 描述: 浏览器的滚动条插件
 * 原则和思路:  不依赖任何框架和类库, 低侵入.
 * 兼容性: ie11+
 * 支持: requirejs和commonjs和seajs,
 */
;(function (parent, fun) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = fun();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(fun);
    } else if (typeof define === 'function' && typeof define.cmd === 'object') {
        define(fun);
    } else {
        parent.scrollbar = fun();
    }
})(window.pt || window, function (scrollbar) {

    // 常量
    var THROTTLE_TIME = 12,                                // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
       
        PLACEHOLDER = 'placeholder';                       // 占位符

    // 默认设置
    var f = function () {};
    var default = {
    };

    // 缓存对象
    var cache = {
        count: 0
    };

    // 属性拷贝
    function extend(mod, opt) {
        if (!opt) return mod;
        var conf = {};
        for (var attr in mod) {
            if (typeof opt[attr] !== "undefined") {
                conf[attr] = opt[attr];
            } else {
                conf[attr] = mod[attr];
            }
        }
        return conf;
    }

    // 空对象
    function isEmptyObject(obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    }

    // 节流函数
    function throttle(now) {
        var time = new Date().getTime();
        throttle = function (now) {
            if (now - time > THROTTLE_TIME) {
                time = now;
                return true;
            }
            return false;
        };
        throttle(now);
    }

    // 异步执行回调
    function asyncFun(ck) {
        setTimeout(function () {
            ck && typeof ck === 'function' && ck();
        }, 0);
    }

    // 事件处理对象
    var handleEvent = {
        init: function (isbind, body) {
            if (this.isbind) return;
            this.isbind = isbind;
            this.body = body;
            this.unbindEvent();
            this.bindEvent();
        },
        // 绑定监听
        bindEvent: function () {
            document.addEventListener('mousedown', this.mousedown, false);
            document.addEventListener('mousemove', this.mousemove, false);
            document.addEventListener('mouseup', this.mouseup, false);
            this.isbind = true;
        },
        // 移除监听
        unbindEvent: function () {
            document.removeEventListener('mousedown', this.mousedown, false);
            document.removeEventListener('mousemove', this.mousemove, false);
            document.removeEventListener('mouseup', this.mouseup, false);
            this.isbind = false;
        },
        mousedown: function (event) {
        },
        mousemove: function (event) {
            if (dragdrop.isDrag) {}
        },
        mouseup: function (event) {
            if (dragdrop.isDrag) {                
            }
        },
    };

    // 拖拽对象
    var dragdrop = {
        isDrag: false,              // 是否正在拖拽
        dragNode: {                 // 拖拽节点的的关联数据
            id: undefined,          // 拖拽节点的id
            node: null,             // 占位符节点的关联数据
        },
        dragElement: null,          // 拖拽的dom节点
        dragstart: function (event, node) {
        },
        drag: function (event) {
        },
        dragend: function (event) {
        }
    };

    // 展示对象, 操作dom
    var view = {
        setContainerWH: function (container, width, height) {
            if (container) {
                var width = width !== undefined ? 'width:' + width + 'px;' : 'width:auto;';
                var height = height !== undefined ? 'height:' + height + 'px;' : 'height:auto;';
                container.style.cssText += ';' + width + height + ';';
            }
        },
        getContainerOffset: function(node, offset) {
            if (node === null || node === document) return offset;
                offset.top += node.offsetTop;
                offset.left += node.offsetLeft;
            return this.getContainerOffset(node.offsetParent, offset);
        },
        searchUp: function (node, type) {
            if (node === handleEvent.body || node === document) return undefined;   // 向上递归到body就停
            var arr = typeof node.className === 'string' && node.className.split(' ');
            if (arr) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    if (arr[i] === type) {
                        return node;
                    }
                }
            }
            return this.searchUp(node.parentNode, type);
        },
        create: function (grid, node, className) {
        },
        update: function (grid, element, node, className) {
        },
        clear: function (container) {
        },
        remove: function (id) {
        },
        render: function (data, elements, container, grid) {
        }
    };

    // 滚动条对象
    function Scroll(options, container, originalData) {
        // 兼容多种配置情况
        if (Array.isArray(options) && originalData === undefined) {
            originalData = options;
            options = undefined;
        }
        this.init(extend(setting, options), container, originalData);
    }

    // 网格对象原型
    Scroll.prototype = {
        constructor: Grid,
        init: function (opt, container, originalData) {
        },
        destroy: function () {
        },
        load: function (isload) {
        },
        resize: function (containerW, containerH) {
        },
        add: function (n, isload) {
        },
        delete: function (id, isload) {
        },
        edit: function (n, isload) {
        },
        query: function (id) {
        },
        setDraggable: function (draggable) {
        },
        clone: function (node) {
            var obj = {};
            for (var attr in node)
                if (node.hasOwnProperty(attr))
                    obj[attr] = node[attr];
            return obj;
        }
    };

    // 构建实例
    function instance(options, container, originalData) {
        // 初始化监听, 单例, 仅绑定一次
        handleEvent.init(true, document.body);
        // 判断容器
        if (!container)
            container = document.querySelector('.' + GRID_CONTAINER);
        else if (typeof jQuery === "object" && container instanceof jQuery)
            container = container[0];
        // 设置编号
        var index = GRID_CONTAINER + cache.count++;
        if (!container.getAttribute(GRID_CONTAINER_INDEX))
            container.setAttribute(GRID_CONTAINER_INDEX, index);
        cache[index] = new Scroll(options, container, originalData);
        ;
        return cache[index];
    }

    // 销毁实例
    function destroy(obj) {
        delete cache[obj.opt.container.getAttribute(GRID_CONTAINER_INDEX)];
        obj.destroy();
        obj = null;
    }

    scrollbar = {
        version: "1.0.0",
        instance: instance,
        destroy: destroy
    };

    return scrollbar;
});
