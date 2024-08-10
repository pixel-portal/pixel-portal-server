
export default class Utils {

  static s4 (): string {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  static uuid (): string {
    return `${Utils.s4()}${Utils.s4()}-${Utils.s4()}-${Utils.s4()}-${Utils.s4()}-${Utils.s4()}${Utils.s4()}${Utils.s4()}`;
  }

}
