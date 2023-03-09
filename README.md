# cesium-windy-canvas
Cesium上建立风场动态粒子效果,自己封装可使用的API

**已经发布插件咯**
`https://www.npmjs.com/package/cesium-windy-canvas`
`npm i cesium-windy-canvas -S`

效果图如下

![效果杠杠的](https://raw.githubusercontent.com/Quietly-20201113/cesium-windy-canvas/master/windy.gif)

**参数讲解**

| 参数名          | 参数解释                                    | 类型   | 默认值                         |
| --------------- | ------------------------------------------- | ------ | ------------------------------ |
| viewer          | Cesium初始化后赋值变量                      | Object | null                           |
| canvas          | 风场画布                                    | DOM    | null                           |
| canvasContext   | canvas上下文                                | DOM    | params.canvas.getContext('2d') |
| canvasWidth     | 画布宽度                                    | Number | 300                            |
| canvasHeight    | 画布高度                                    | Number | 180                            |
| speedRate       | 风前进速度                                  | Number | 100                            |
| extent          | 风场绘制地图范围                            | Array  | []                             |
| particlesNumber | 粒子总数                                    | Number | 20000                          |
| maxAge          | 每个粒子的最大生存周期                      | Number | 120                            |
| frameTime       | 每秒刷新次数                                | Number | 100                            |
| lineWidth       | 粒子线条宽度                                | Number | 1                              |
| initExtent      | 风场初始范围                                | Array  | []                             |
| calc_speedRate  | 根据speedRate参数计算经纬度步进长度         | Array  | [0, 0]                         |
| windField       | 风场网格                                    | Object | null                           |
| particles       | 风场粒子存储                                | Array  | []                             |
| animateFrame    | requestAnimationFrame事件句柄，用来清除操作 | Object | null                           |
| isdistory       | 是否进行销毁                                | bool   | false                          |
| windyColor      | 风场颜色集合(根据风速不同设置不同颜色)      | class  | new WindyColor()               |

**教程讲解-个人博客**

[vue3.0+vite+Cesium使用记录](https://blog.ynsites.com/post/26)

[Cesium上建立风场动态粒子效果](https://blog.ynsites.com/post/27)
