
import djs from 'dayjs';
import { Timestamp } from './include';

declare module 'dayjs' {
  type ManipulateUnitType = Exclude<djs.UnitType, 'date' | 'dates'>;
  interface Dayjs {
      ceil(unit: djs.ManipulateUnitType, amount: number): djs.Dayjs;
      toStamp(): Timestamp;
  }
}

const plugin: djs.PluginFunc = (option, dayjsClass) => {
  dayjsClass.prototype.ceil = function (unit, amount) {
    return this.add(amount - (this.get(unit) % amount), unit).startOf(unit);
  };
  dayjsClass.prototype.toStamp = function () {
    return Timestamp.fromDate(this.toDate())
  };
};
djs.extend(plugin);

export default djs;