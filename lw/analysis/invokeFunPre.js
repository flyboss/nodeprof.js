(function (sandbox) {
  function my() {
    this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
      console.log("=== invokeFunPre ===");
      console.log("Callsite iid       :", iid, J$.iidToLocation(iid));
      console.log("Function           :", f);
      console.log("Base (this) object :", base);
      console.log("Arguments          :", args);
      console.log("isConstructor      :", isConstructor);
      console.log("isMethod           :", isMethod);
      console.log("FunctionIid        :", functionIid);
      console.log("FunctionSid        :", functionSid);
      console.log("---------------------------\n");
    };

  }
  sandbox.analysis = new my();
})(J$);
