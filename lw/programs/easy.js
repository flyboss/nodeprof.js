// function foo() {
//     return 42;
// }
// foo();
function vulnerable(input) {
  const obj = {};
  const key = input.key;
  const value = input.value;
  obj[key] = value; // 潜在污染点
}


//
vulnerable({
  key: "__proto__.toString",
  value: 1
});

vulnerable({
  key: "__proto__.__proto__.toString",
  value: 1
});

vulnerable({
  key: "__proto__.toString",
  value: 1
});

vulnerable({
  key: "__proto__.toString",
  value: 1
});
