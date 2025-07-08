function foo(a){ // 9
  return a;
}

function bar(b){ // 12
  return b;
}

function baz(c) {
  this.f(); // 8 谁拥有调用权并触发函数执行，this 就指向谁
}

function T() {
  this.f = foo;
  this.r = baz;
}

var t = new T();
for(var i = 0; i < 2; i++) {
  t.r();
  t.f(); // 11
  t.f = bar;
}

