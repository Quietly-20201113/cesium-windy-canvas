import * as Cesium from 'cesium';
import CanvasParticle from '@/utils/windy/canvasparticle';
import CanvasWindField from '@/utils/windy/canvasWindField.js';
import WindyColor from '@/utils/windy/windyColor';

export default class CesiumWindy {
  constructor(json, params) {
    this.windData = json;
    this.viewer = params.viewer;
    this.canvas = params.canvas;
    this.extent = params.extent || [];// 风场绘制时的地图范围，范围不应该大于风场数据的范围，顺序：west/east/south/north，有正负区分，如：[110,120,30,36]
    this.canvasContext = params.canvas.getContext('2d');// canvas上下文
    this.canvasWidth = params.canvasWidth || 300;// 画板宽度
    this.canvasHeight = params.canvasHeight || 180;// 画板高度
    this.speedRate = params.speedRate || 100;// 风前进速率，意思是将当前风场横向纵向分成100份，再乘以风速就能得到移动位置，无论地图缩放到哪一级别都是一样的速度，可以用该数值控制线流动的快慢，值越大，越慢，
    this.particlesNumber = params.particlesNumber || 20000;// 初始粒子总数，根据实际需要进行调节
    this.maxAge = params.maxAge || 120;// 每个粒子的最大生存周期
    this.frameTime = 1000 / (params.frameRate || 10);// 每秒刷新次数，因为requestAnimationFrame固定每秒60次的渲染，所以如果不想这么快，就把该数值调小一些
    this.color = params.color || '#ffffff';// 线颜色，提供几个示例颜色['#14208e','#3ac32b','#e0761a']
    this.lineWidth = params.lineWidth || 1;// 线宽度
    this.initExtent = [];// 风场初始范围
    this.calc_speedRate = [0, 0];// 根据speedRate参数计算经纬度步进长度
    this.windField = null;
    this.particles = [];
    this.animateFrame = null;// requestAnimationFrame事件句柄，用来清除操作
    this.isdistory = false;// 是否销毁，进行删除操作
    this.windyColor = params.windyColor || new WindyColor();
    // eslint-disable-next-line
    this._init();
  }

  // eslint-disable-next-line
  _init() {
    const self = this;
    // 创建风场网格
    this.windField = this.createField();
    this.initExtent = [this.windField.west - 180, this.windField.east - 180, this.windField.south, this.windField.north];
    // 如果风场创建时，传入的参数有extent，就根据给定的extent，让随机生成的粒子落在extent范围内
    if (this.extent.length !== 0) {
      this.extent = [
        Math.max(this.initExtent[0], this.extent[0]),
        Math.min(this.initExtent[1], this.extent[1]),
        Math.max(this.initExtent[2], this.extent[2]),
        Math.min(this.initExtent[3], this.extent[3]),
      ];
    }
    // console.log(this.extent);
    // eslint-disable-next-line
    this._calcStep();
    // 创建风场粒子
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.particlesNumber; i++) {
      this.particles.push(this.randomParticle(new CanvasParticle()));
    }
    this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.97)';
    this.canvasContext.globalAlpha = 0.6;
    this.animate();
    let then = Date.now();
    (function frame() {
      if (!self.isdistory) {
        self.animateFrame = requestAnimationFrame(frame);
        const now = Date.now();
        const delta = now - then;
        if (delta > self.frameTime) {
          // eslint-disable-next-line no-mixed-operators
          then = now - delta % self.frameTime;
          self.animate();
        }
      } else {
        self.removeLines();
      }
    }());
  }

  // 计算经纬度步进长度
  // eslint-disable-next-line
  _calcStep() {
    const isextent = (this.extent.length !== 0);
    const calcExtent = isextent ? this.extent : this.initExtent;
    const calcSpeed = this.speedRate;
    this.calc_speedRate = [(calcExtent[1] - calcExtent[0]) / calcSpeed, (calcExtent[3] - calcExtent[2]) / calcSpeed];
  }

  // 根据现有参数重新生成风场
  redraw() {
    window.cancelAnimationFrame(this.animateFrame);
    this.particles = [];
    // eslint-disable-next-line
    this._init();
  }

  createField() {
    // eslint-disable-next-line
    const data = this._parseWindJson();
    return new CanvasWindField(data);
  }

  animate() {
    const self = this;
    const field = self.windField;
    let nextLng = null;
    let nextLat = null;
    let uv = null;
    self.particles.forEach((particle) => {
      if (particle.age <= 0) {
        self.randomParticle(particle);
      }
      if (particle.age > 0) {
        const {
          tlng, tlat,
        } = particle;
        // eslint-disable-next-line
        const gridpos = self._togrid(tlng, tlat);
        const tx = gridpos[0];
        const ty = gridpos[1];
        if (!self.isInExtent(tlng, tlat)) {
          // eslint-disable-next-line no-param-reassign
          particle.age = 0;
        } else {
          uv = field.getIn(tx, ty);
          nextLng = tlng + self.calc_speedRate[0] * uv[0];
          nextLat = tlat + self.calc_speedRate[1] * uv[1];
          // eslint-disable-next-line no-param-reassign
          particle.lng = tlng;
          // eslint-disable-next-line no-param-reassign
          particle.lat = tlat;
          // eslint-disable-next-line no-param-reassign
          particle.x = tx;
          // eslint-disable-next-line no-param-reassign
          particle.y = ty;
          // eslint-disable-next-line no-param-reassign
          particle.tlng = nextLng;
          // eslint-disable-next-line no-param-reassign
          particle.tlat = nextLat;
          // eslint-disable-next-line no-plusplus, no-param-reassign
          particle.age--;
        }
      }
    });
    if (self.particles.length <= 0) this.removeLines();
    // eslint-disable-next-line
    self._drawLines();
  }

  // 粒子是否在地图范围内
  isInExtent(lng, lat) {
    const calcExtent = this.initExtent;
    if ((lng >= calcExtent[0] && lng <= calcExtent[1]) && (lat >= calcExtent[2] && lat <= calcExtent[3])) return true;
    return false;
  }

  // eslint-disable-next-line
  _resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // eslint-disable-next-line
  _parseWindJson() {
    let uComponent = null;
    let vComponent = null;
    let header = null;
    this.windData.forEach((record) => {
      const type = `${record.header.parameterCategory},${record.header.parameterNumber}`;
      switch (type) {
        case '2,2':
          uComponent = record.data;
          header = record.header;
          break;
        case '2,3':
          vComponent = record.data;
          break;
        default:
          break;
      }
    });
    return {
      header,
      uComponent,
      vComponent,
    };
  }

  removeLines() {
    window.cancelAnimationFrame(this.animateFrame);
    this.isdistory = true;
    this.canvas.width = 1;
    document.getElementById('content')?.removeChild(this.canvas);
  }

  // 根据粒子当前所处的位置(棋盘网格位置)，计算经纬度，在根据经纬度返回屏幕坐标
  // eslint-disable-next-line
  _tomap(lng, lat, particle) {
    const ct3 = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
    // 判断当前点是否在地球可见端
    const isVisible = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, this.viewer.camera.position).isPointVisible(ct3);
    const pos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, ct3);
    if (!isVisible) {
      // eslint-disable-next-line no-param-reassign
      particle.age = 0;
    }
    // console.log(pos);
    return pos ? [pos.x, pos.y] : null;
  }

  // 根据经纬度，算出棋盘格位置
  // eslint-disable-next-line
  _togrid(lng, lat) {
    const field = this.windField;
    // eslint-disable-next-line no-mixed-operators
    const x = (lng - this.initExtent[0]) / (this.initExtent[1] - this.initExtent[0]) * (field.cols - 1);
    // eslint-disable-next-line no-mixed-operators
    const y = (this.initExtent[3] - lat) / (this.initExtent[3] - this.initExtent[2]) * (field.rows - 1);
    return [x, y];
  }

  // eslint-disable-next-line
  _drawLines() {
    const self = this;
    const { particles } = this;
    this.canvasContext.lineWidth = self.lineWidth;
    // 后绘制的图形和前绘制的图形如果发生遮挡的话，只显示后绘制的图形跟前一个绘制的图形重合的前绘制的图形部分，示例：https://www.w3school.com.cn/tiy/t.asp?f=html5_canvas_globalcompop_all
    this.canvasContext.globalCompositeOperation = 'destination-in';
    this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.canvasContext.globalCompositeOperation = 'lighter';// 重叠部分的颜色会被重新计算
    this.canvasContext.globalAlpha = 0.9;
    // this.canvasContext.beginPath();
    // const gradient = this.canvasContext.createLinearGradient(0, 0, 170, 0);
    particles.forEach((particle) => {
      // eslint-disable-next-line
      const movetopos = self._tomap(particle.lng, particle.lat, particle);
      // eslint-disable-next-line
      const linetopos = self._tomap(particle.tlng, particle.tlat, particle);
      self.canvasContext.beginPath();
      // self.canvasContext.fillStyle = particle.color;
      // self.canvasContext.fill();
      // console.log(movetopos,linetopos);
      // self.canvasContext.beginPath();
      // self.canvasContext.stroke();
      if (movetopos != null && linetopos != null) {
        self.canvasContext.moveTo(movetopos[0], movetopos[1]);
        self.canvasContext.lineTo(linetopos[0], linetopos[1]);
        // self.canvasContext.fillStyle = particle.color;
        self.canvasContext.strokeStyle = particle.color;
        // self.canvasContext.putImageData(0, 0, 0);
        self.canvasContext.stroke();
        // self.canvasContext.strokeStyle = particle.color;
        // self.canvasContext.beginPath();
      }
    });
    // this.canvasContext.stroke();
  }

  // 随机数生成器（小数）
  // eslint-disable-next-line class-methods-use-this
  fRandomByfloat(under, over) {
    return under + Math.random() * (over - under);
  }

  // 随机数生成器（整数）
  // eslint-disable-next-line class-methods-use-this
  fRandomBy(under, over) {
    switch (arguments.length) {
      case 1: return parseInt(Math.random() * under + 1, 10);
      case 2: return parseInt(Math.random() * (over - under + 1) + under, 10);
      default: return 0;
    }
  }

  // 根据当前风场extent随机生成粒子
  randomParticle(particle) {
    let safe = 30; let x = -1; let y = -1; let lng = null; let lat = null;
    // eslint-disable-next-line eqeqeq
    const hasextent = this.extent.length != 0;
    // eslint-disable-next-line camelcase
    const calc_extent = hasextent ? this.extent : this.initExtent;
    do {
      try {
        if (hasextent) {
          // eslint-disable-next-line camelcase
          const pos_x = this.fRandomBy(0, this.canvasWidth);
          // eslint-disable-next-line camelcase
          const pos_y = this.fRandomBy(0, this.canvasHeight);
          const cartesian = this.viewer.camera.pickEllipsoid(new Cesium.Cartesian2(pos_x, pos_y), this.viewer.scene.globe.ellipsoid);
          const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
          if (cartographic) {
            // 将弧度转为度的十进制度表示
            lng = Cesium.Math.toDegrees(cartographic.longitude);
            lat = Cesium.Math.toDegrees(cartographic.latitude);
          }
        } else {
          // eslint-disable-next-line camelcase
          lng = this.fRandomByfloat(calc_extent[0], calc_extent[1]);
          // eslint-disable-next-line camelcase
          lat = this.fRandomByfloat(calc_extent[2], calc_extent[3]);
        }
      } catch (e) {
        console.error(e);
      }
      if (lng) {
        // eslint-disable-next-line
        const gridpos = this._togrid(lng, lat);
        // eslint-disable-next-line prefer-destructuring
        x = gridpos[0];
        // eslint-disable-next-line prefer-destructuring
        y = gridpos[1];
      }
    // eslint-disable-next-line no-plusplus
    } while (this.windField.getIn(x, y)[2] <= 0 && safe++ < 30);
    // eslint-disable-next-line no-underscore-dangle
    // const _color = ['#EFFFFD', '#B8FFF9', '#85F4FF', '#42C2FF'];
    const field = this.windField;
    const uv = field.getIn(x, y);
    const nextLng = lng + this.calc_speedRate[0] * uv[0];
    const nextLat = lat + this.calc_speedRate[1] * uv[1];
    // eslint-disable-next-line no-param-reassign
    particle.lng = lng;
    // eslint-disable-next-line no-param-reassign
    particle.lat = lat;
    // eslint-disable-next-line no-param-reassign
    particle.x = x;
    // eslint-disable-next-line no-param-reassign
    particle.y = y;
    // eslint-disable-next-line no-param-reassign
    particle.tlng = nextLng;
    // eslint-disable-next-line no-param-reassign
    particle.tlat = nextLat;
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    particle.speed = uv[2];
    // eslint-disable-next-line no-param-reassign
    particle.age = Math.round(Math.random() * this.maxAge);// 每一次生成都不一样
    // eslint-disable-next-line no-param-reassign
    particle.color = this.windyColor.getWindColor(particle.speed);
    return particle;
  }

  clearRect() {
    this.isdistory = true;
  }

  start() {
    this.isdistory = false;
  }
}
