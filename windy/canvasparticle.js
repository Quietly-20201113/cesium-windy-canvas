/**
 * 粒子对象
 */
export default class CanvasParticle {
  constructor() {
    this.lng = null; // 粒子初始经度
    this.lat = null; // 粒子初始纬度
    this.x = null; // 粒子初始x位置(相对于棋盘网格，比如x方向有360个格，x取值就是0-360，这个是初始化时随机生成的)
    this.y = null; // 粒子初始y位置(同上)
    this.tlng = null; // 粒子下一步将要移动的经度，这个需要计算得来
    this.tlat = null; // 粒子下一步将要移动的y纬度，这个需要计算得来
    this.age = null; // 粒子生命周期计时器，每次-1
    this.speed = null; // 粒子移动速度，可以根据速度渲染不同颜色
    this.color = null;
  }
}
