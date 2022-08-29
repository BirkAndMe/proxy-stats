class ProxyStats {
  constructor() {
    this._timers = {};
    this.stats = {};
  }

  static watch(target) {
    const proxyStats = new ProxyStats();
    return proxyStats.watch(target);
  }

  watch(target) {
    return new Proxy(target, this)
  }

  getTimeKey(target, property) {
    return `${target.constructor.name}.${property}`;
  }

  time(key) {
    this._timers[key] = Date.now();
  }

  timeEnd(key) {
    const time = Date.now() - this._timers[key];
    this.updateStats(key, time);

    console.log(key, `${time} ms (${this.stats[key].time} ms -- ${this.stats[key].count})`);
  }

  updateStats(key, time) {
    this.stats[key] = this.stats[key] || {time: 0, count: 0};

    this.stats[key].time +=  time;
    this.stats[key].count += 1;
  }

  handleFunction(target, property, receiver) {
    const me = this;

    return new Proxy(target[property], {
      apply(fnTarget, thisArg, args) {
        const timeKey = me.getTimeKey(target, property) + '()';
        me.time(timeKey);
        const result = Reflect.apply(fnTarget, thisArg, args);
        me.timeEnd(timeKey);

        return result;
      }
    });
  }

  get(target, property, receiver) {
    if (typeof target[property] === 'function') {
      return this.handleFunction(target, property, receiver);
    }

    const timeKey = 'get ' + this.getTimeKey(target, property);

    this.time(timeKey);
    const result = Reflect.get(target, property, receiver);
    this.timeEnd(timeKey);

    return result;
  }

  set(target, property, value, receiver) {
    const timeKey = 'set ' + this.getTimeKey(target, property);

    this.time(timeKey);
    Reflect.set(target, property, value, receiver);
    this.timeEnd(timeKey);

    return true;
  }
}
