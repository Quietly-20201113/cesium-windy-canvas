export default class WindyColor {
  constructor(color) {
    this.color = color || ['#293C8B', '#BBF49A', '#869C4A', '#369D41', '#287A61'];
  }

  // eslint-disable-next-line consistent-return
  getWindColor(windScale) {
    if (windScale <= 6) return this.color[0];
    if (windScale <= 8) return this.color[1];
    if (windScale <= 10) return this.color[2];
    if (windScale <= 12) return this.color[3];
    return this.color[4];
  }
}
