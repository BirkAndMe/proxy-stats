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

  time(key) {
    this._timers[key] = this._timers[key] || [];
    this._timers[key].push(Date.now());

    return key;
  }

  timeEnd(key) {
    const time = Date.now() - this._timers[key].pop();

    if (this._timers[key].length === 0) {
      this.updateStats(key, time);
      console.log(key, `${time} ms (${this.stats[key].time} ms -- ${this.stats[key].count})`);
    } else {
      this.updateStats(key, 0);
      console.log(key, `${time} ms (${this.stats[key].time + time} ms -- ${this.stats[key].count})`);
    }
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
        const timeKey = me.time(`${target.constructor.name}.${property}()`);
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

    const timeKey = this.time(`get ${target.constructor.name}.${property}`);
    const result = Reflect.get(target, property, receiver);
    this.timeEnd(timeKey);

    return result;
  }

  set(target, property, value, receiver) {
    const timeKey = this.time(`set ${target.constructor.name}.${property}`);
    Reflect.set(target, property, value, receiver);
    this.timeEnd(timeKey);

    return true;
  }
}
