// 1. 普通函数
function foo(x) {
    return x + 1;
}
foo(10);

// 2. 对象方法
const obj = {
    hi: 'Hello ',
    greet(name) {
        return this.hi + name;
    }
};
obj.greet("Rick");

// 3. 构造函数调用
function Person(name) {
    this.name = name;
}
new Person("Alice");

// 4. 匿名函数
const anon = function(x) {
    return x * 2;
};
anon(5);

// 5. 箭头函数
const arrow = (x) => x + 1;
arrow(3);

// 6. 闭包中的函数
function outer() {
    function inner() {
        return "hello";
    }
    inner();
}
outer();
