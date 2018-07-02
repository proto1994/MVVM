class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      let fragment = this.nodeToFragment(this.el);
      this.compile(fragment);
      this.el.appendChild(fragment);
    }
  }

  nodeToFragment(el) {
    let fragment = document.createDocumentFragment();
    let firstChild;
    while ((firstChild = el.firstChild)) {
      fragment.appendChild(firstChild);
    }
    return fragment;
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }

  isDirective(name) {
    return name.includes("v-");
  }

  compile(fragment) {
    let childNodes = fragment.childNodes;
    Array.from(childNodes).forEach(node => {
      if (this.isElementNode(node)) {
        this.compileElement(node);
        this.compile(node);
      } else {
         this.compileText(node);
      }
    });
  }

  compileText(node) {
    let text = node.textContent;
    let reg = /\{\{([^}]+)\}\}/g;
    if (reg.test(text)) {
      CompileUtil['text'](node,this.vm,text);
    }
  }

  compileElement(node) {
    let attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      let attrName = attr.name;
      if (this.isDirective(attrName)) {
        let expr = attr.value;
        // 取v-后面的值
        let type = attrName.slice(2);
        CompileUtil[type](node, this.vm, expr);
      }
    });
  }
}

CompileUtil = {
  getVal(vm, expr) {
    expr = expr.split('.');
    return expr.reduce((pre, next) => {
      return pre[next];
    }, vm.$data);
  },

  setVal(vm, expr, value) {
    expr = expr.split(".");
    return expr.reduce((pre, next, currentIndex) => {
      if (currentIndex === expr.length - 1) {
        return (pre[next] = value);
      }
      return pre[next];
    }, vm.$data);
  },

  getTextVal(vm, text) {
    return text.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      //拿到第一个分组，并且要取得没有空格的字符串，否则会报错
      return this.getVal(vm, arguments[1].trim());
    });
  },

  text(node, vm, text) {
    let updateFn = this.updater["textUpdater"];
    let value = this.getTextVal(vm, text);

    text.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      new Watcher(vm, arguments[1].trim(), newValue => {
        updateFn && updateFn(node, this.getTextVal(vm, newValue));
      });
    });
    updateFn && updateFn(node, value);
  },

  model(node, vm, expr) {
    let updateFn = this.updater['modelUpdater'];
    new Watcher(vm, expr, newValue => {
      updateFn && updateFn(node, this.getVal(vm, expr));
    });
    node.addEventListener("input", e => {
      let newValue = e.target.value;
      this.setVal(vm, expr, newValue);
    });

    updateFn && updateFn(node, this.getVal(vm, expr));
  },

  updater: {
    textUpdater(node, value) {
      node.textContent = value;
    },
    modelUpdater(node, value) {
      node.value = value;
    }
  }
};
