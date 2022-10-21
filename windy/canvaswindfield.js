/**
* 棋盘类
* 根据风场数据生产风场棋盘网格
* */
export default class CanvasWindField {
  constructor(obj) {
    this.west = null;
    this.east = null;
    this.south = null;
    this.north = null;
    this.rows = null;
    this.cols = null;
    this.dx = null;
    this.dy = null;
    this.unit = null;
    this.date = null;
    this.grid = null;
    this.init(obj);
  }

  // eslint-disable-next-line class-methods-use-this
  calcUV(u, v) {
    return [+u, +v, Math.sqrt(u * u + v * v)];
  }

  init(obj) {
    const {
      header, uComponent, vComponent,
    } = obj;
    this.west = +header.lo1;
    this.east = +header.lo2;
    this.south = +header.la2;
    this.north = +header.la1;
    this.rows = +header.ny;
    this.cols = +header.nx;
    this.dx = +header.dx;
    this.dy = +header.dy;
    this.unit = header.parameterUnit;
    this.date = header.refTime;
    this.grid = [];
    let k = 0;
    let rows = null;
    let uv = null;
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < this.rows; j++) {
      rows = [];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < this.cols; i++, k++) {
        uv = this.calcUV(uComponent[k], vComponent[k]);
        rows.push(uv);
      }
      this.grid.push(rows);
    }
  }

  bilinearInterpolation(x, y, g00, g10, g01, g11) {
    const rx = (1 - x);
    const ry = (1 - y);
    const a = rx * ry; const b = x * ry; const c = rx * y; const d = x * y;
    const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return this.calcUV(u, v);
  }

  getIn(x, y) {
    if (x < 0 || x >= 359 || y >= 180) {
      return [0, 0, 0];
    }
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    if (x0 === x && y0 === y) return this.grid[y][x];
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const g00 = this.getIn(x0, y0);
    const g10 = this.getIn(x1, y0);
    const g01 = this.getIn(x0, y1);
    const g11 = this.getIn(x1, y1);
    let result = null;
    try {
      result = this.bilinearInterpolation(x - x0, y - y0, g00, g10, g01, g11);
    } catch (e) {
      console.error(x, y);
    }
    return result;
  }

  isInBound(x, y) {
    if ((x >= 0 && x < this.cols - 1) && (y >= 0 && y < this.rows - 1)) return true;
    return false;
  }
}
