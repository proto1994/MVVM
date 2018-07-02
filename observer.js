class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]);
      this.observer(data[key]);
    })
  }
  defineReactive(obj, key, value) {
    let that = this;
    let dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        console.log(key)
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set(newValue) {
        console.log('set')
        if (newValue !== value) {
        //  that.observer(newValue);
          value = newValue;
          dep.notify();
        }
      }
    })
  }
}
