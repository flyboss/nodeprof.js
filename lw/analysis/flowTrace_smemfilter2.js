(function (J$) {
  //Datastructure Listing
  var output = [];
  var callStack = [];
  //var frmToFunName = {};
  var funIDToDecl = {};
  var scriptSet = []
  var lst = []
  var lstKeys = []
  var lstMap = {}

  //Variable Listing
  var objGetOwnPropDesc = Object.getOwnPropertyDescriptor;
  var objGetPrototypeOf = Object.getPrototypeOf;

  var funName;
  var SPECIAL_PROP_SID = J$.Constants.SPECIAL_PROP_SID;
  var SPECIAL_PROP_IID = J$.Constants.SPECIAL_PROP_IID;
  var isBrowser = J$.Constants.isBrowser;
  var ifNative = "";
  var scriptName = "";
  var avail = false;
  var format = /(?!\()(\S+\.js)\:([0-9]+\:[0-9]+\:[0-9]+\:[0-9]+)\)/gi;
  var jSetTimeout = setTimeout
  var jSetInterval = setInterval
  var jClearTimeout = clearTimeout
  var jClearInterval = clearInterval
  var spclList = [jSetTimeout, jSetInterval, jClearTimeout, jClearInterval]
  var jFunToString = Function.prototype.toString
  J$.ast_info = []
  J$.ast_info = { 'lw/easy.js@1:1:3:2': ['lw/easy.js@4:1:4:6'] }
  function getValue(v) {
    var type = typeof v;
    if (v !== null) {
      try {
        var shadowObj = J$.smemory.getShadowObjectOfObject(v);
        var shadowId = J$.smemory.getIDFromShadowObjectOrFrame(shadowObj)
        if (type === 'function') {
          ifNative = isNative(v) ? "Nat" : "Non"
          return "Fun" + ifNative + ":" + shadowId;

        } else if (type === 'object') {
          return "Obj" + shadowId;
        }
      } catch (e) {
        console.log("Shadowing error: " + e)
        return;
      }

    }
  }
  function getPropSafe(base, prop) {
    if (base === null || base === undefined) {
      return undefined;
    }
    return base[prop];
  }
  function getFrameToFunName(obj) {
    if (obj === undefined || obj === null) return "None";
    return obj["FUN_NAME"];
  }
  function getFrameID(name) {
    return "Frm" + J$.smemory.getIDFromShadowObjectOrFrame(J$.smemory.getShadowFrame(name));
  }
  function getCurrentFrameID() {
    return "Frm" + J$.smemory.getIDFromShadowObjectOrFrame(J$.smemory.getCurrentFrame());
  }
  function addToTrace(typ, funName, identity, loc, others, flag = false) {
    //if (typ=="InvokeReturn" && others!==null ) {console.log(others)}
    //var indx = lst.indexOf(identity)
    //if(flag===true || indx > -1 || (typ=="InvokeReturn" && others!==null && lst.indexOf(others[0]["retId"]) > -1)){
    var newObj = {}
    newObj.typ = typ;
    newObj.funName = funName;
    newObj.identity = identity;
    newObj.loc = loc;
    if (typ == "InvokeReturn") {
      newObj.ret = others;
    }
    else if (typ == "Get" || typ == "Getter") {
      newObj.from = others[0];
      newObj.comp = others[1];
    }
    else if (typ == "LocRead" || typ == "LexRead") {
      newObj.from = others[0];
      newObj.curr = others[1];
      newObj.eloc = others[2]
    }
    else if (typ == "Write" || typ == "Declare") {
      newObj.to = others;
    }
    else if (typ == "Put" || typ == "Setter") {
      newObj.to = others[0];
      newObj.comp = others[1];
    }
    output.push(newObj)
    //}
  }
  function isNative(input) {
    if (jFunToString.call(input) !== undefined) {
      return jFunToString.call(input).indexOf('[native code]') > -1 || jFunToString.call(input).indexOf('[object ') === 0 || spclList.indexOf(input) > -1
    }
  }
  /**
   * @desc Given an object and property, it returns if the property is a getter
   * @param {object} obj - Base object
   * @param {string} prop - Property
   * @returns {string} desc - The descriptor for the property
   */
  function getPropertyDescriptor(o, prop) {
    var t = o;
    while (t != null) {
      var desc = objGetOwnPropDesc(t, prop);
      if (desc) {
        return desc;
      }
      t = objGetPrototypeOf(t);
    }

    return null;
  }
  /**
   * @desc Given an object and property, it identifies if the property is a getter
   * @param {object} obj - Base object
   * @param {string} prop - Property
   * @returns {boolean} - True/False identicating if getter or not
   */
  function isGetter(obj, prop) {
    var desc = getPropertyDescriptor(obj, prop);
    return desc && (desc.get !== undefined);
  }
  /**
   * @desc Given an object and property, it identifies if the property is a setter
   * @param {object} obj - Base object
   * @param {string} prop - Property
   * @returns {boolean} - True/False identicating if setter or not
   */
  function isSetter(obj, prop) {
    var desc = getPropertyDescriptor(obj, prop);
    return desc && (desc.set !== undefined);
  }
  /**
   * @desc Given a global instruction identifier, it returns a string containing 
   * the script name, begin and end line numbers and column 
   * Example: (ScriptName@beginLineNumber:beginColumnNumber:endLineNumber:endColumnNumber)
   * @param {number} giid - Static unique instruction identifier of this callback
   * @returns {string} final - The customised location of an instruction identifier
   */
  function getLoc(from, giid) {
    //locations for native functions, returning string None
    if (giid == "undefined:undefined") {
      return "None";
    }
    loc = J$.iidToLocation(giid);
    var locIid = "";
    try {
      locIid = format.exec(loc);
      format.lastIndex = 0;
      return locIid[1].replace("(", ":") + "@" + locIid[2];
    }
    catch (e) {
      console.log("Unsupported format: " + from + "," + loc)
      return;
    }
    return loc;
  }

  function getLocSafe(iid) {
    try {
        if (typeof iid === 'string' || typeof iid === 'number') {
            return J$.iidToLocation(iid);
        }
    } catch (e) {
        console.log("[warn] iidToLocation failed for:", iid);
    }
    return undefined;
}

  J$.analysis = {
    putField: function (iid, base, offset, val, isComputed, isOpAssign) {
      if (isSetter(base, offset)) {
        var desc = getPropertyDescriptor(base, offset);
        funName = desc.set.name ? desc.set.name : "anon"
        funId = getValue(desc.set)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Put", funName, funId, getLoc("put", J$.getGlobalIID(iid)), ["set", isComputed])
          addToTrace("InvokeSetter", funName, funId, getLoc("put", J$.getGlobalIID(iid)))
        }
      } else if (typeof val == 'function') {
        funName = val.name ? val.name : "anon"
        funId = getValue(val)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Put", funName, funId, getLoc("put", J$.getGlobalIID(iid)), [String(offset), isComputed])
        }
      }
    },
    getField: function (iid, base, offset, val, isComputed, isOpAssign) {
      if (isGetter(base, offset)) {
        var desc = getPropertyDescriptor(base, offset);
        funName = desc.get.name ? desc.get.name : "anon"
        funId = getValue(desc.get)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Get", funName, funId, getLoc("get", J$.getGlobalIID(iid)), ["get", isComputed])
          addToTrace("InvokeGetter", funName, funId, getLoc("get", J$.getGlobalIID(iid)))
        }
      } else if (typeof val == 'function') {
        funName = val.name ? val.name : "anon"
        funId = getValue(val)
        //|| funId.startsWith("FunNat:")
        if (lst.indexOf(funId) > -1 || funId.indexOf("FunNat:") === 0) {
          addToTrace("Get", funName, funId, getLoc("get", J$.getGlobalIID(iid)), [String(offset), isComputed])
        }

      }
    },
    declare: function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
      if (name === "arguments" && isArgument && typeof val == 'object' && val != null) {
        for (var key of Object.keys(val)) {
          var value = val[key]
          if (typeof value == "function") {
            funName = value.name ? value.name : "anon";
            funId = getValue(value)
            if (lst.indexOf(funId) > -1) {
              addToTrace("Put", funName, funId, getLoc("declare", J$.getGlobalIID(iid)), [String(key), "arguments"])
            }
          }
        }
      }
      else if ((typeof val) === 'function') {
        funName = val.name ? val.name : "anon"
        var funId = getValue(val)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Declare", funName, funId, getLoc("declare", J$.getGlobalIID(iid)), getFrameID(name) + ":" + name)
        }

      }
    },
    literal: function (iid, val, hasGetterSetter) {
      const loc = getLoc("literal", J$.getGlobalIID(iid));
      console.log("[DEBUG] literal location:", loc);
      if (typeof val == 'function') {
        funName = val.name ? val.name : "anon"
        funId = getValue(val)

        console.debug(getLoc("literal", J$.getGlobalIID(iid)));
        console.debug(lstKeys);
        // if (lstKeys.indexOf(getLoc("literal", J$.getGlobalIID(iid))) > -1) {
          addToTrace("Create", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [], true)
          lst.push(funId)
          lstMap[funId] = getLoc("literal", J$.getGlobalIID(iid))
        // }
        funIDToDecl[funId] = getLoc("create", callStack[callStack.length - 1])
      }
      else if (typeof val == 'object' && val != null) {
        if (Array.isArray(val)) {
          for (var key in val) {
            if (typeof val[key] == "function") {
              funName = val[key].name ? val[key].name : "anon";
              funId = getValue(val[key])
              if (lst.indexOf(funId) > -1) {
                addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [String(key), null])
              }
            }
          }
        }
        else {
          for (var key of Object.keys(val)) {
            //new to handle puts of getters/setters
            // || isGetter(val,key) || isSetter(val,key) 
            var value = val[key]
            if (typeof value == "function") {
              funName = value.name ? value.name : "anon";
              funId = getValue(value)
              if (lst.indexOf(funId) > -1) {
                addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [String(key), null])
              }
            }
          }
        }
      }
    },
    functionEnter: function (iid, f, dis, args) {
      var giid = J$.getGlobalIID(iid);
      var frm = getCurrentFrameID();
      var funName = f.name
      var funId = getValue(f)
      if (funName === "") {
        //frmToFunName[frm] = getLoc("fenter1",J$.getGlobalIID(iid))
        J$.smemory.getCurrentFrame()["FUN_NAME"] = getLoc("fenter1", J$.getGlobalIID(iid))

      } else {
        if (callStack.length === 0) {
          //frmToFunName[frm] = "system"+"/"+funName;
          J$.smemory.getCurrentFrame()["FUN_NAME"] = "system" + "/" + funName;
        } else {
          //frmToFunName[frm] =  funIDToDecl[funId]+"/"+funName
          J$.smemory.getCurrentFrame()["FUN_NAME"] = funIDToDecl[funId] + "/" + funName
        }
      }
      callStack.push(giid);
    },
    functionExit: function (iid, returnVal, wrappedExceptionVal) {
      callStack.pop();
    },
    scriptEnter: function (iid, instrumentedFileName, originalFileName) {
      console.debug("Script Entered: ", instrumentedFileName, originalFileName);
      var frm = getCurrentFrameID();
      var giid = J$.getGlobalIID(iid);
      var funName = originalFileName
      //frmToFunName[frm] = funName
      J$.smemory.getCurrentFrame()["FUN_NAME"] = funName
      callStack.push(giid);
      //new to resolve eval/evalIndirect issues
      scriptName = funName;
      //scriptSet.push(scriptName)
      scriptSet.push(frm)
      console.debug("Script Entered: ", Object.keys(J$.ast_info))
      lstKeys = Object.keys(J$.ast_info)
    },
    scriptExit: function (iid, wrappedExceptionVal) {
      callStack.pop();
    },
    invokeFunPre: function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
      if (isNative(f) && f === Array.prototype.push) {
        for (var key of Object.keys(args)) {
          var value = args[key]
          if (typeof value == "function") {
            funName = value.name ? value.name : "anon";
            funId = getValue(value)
            if (lst.indexOf(funId) > -1) {
              var index = String(base.length + Number(key))
              addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [index, "arguments"])
            }

          }
        }
      }
      if (isNative(f) && f === Array.prototype.shift) {
        for (var key in base) {
          if (typeof base[key] == "function") {
            funName = base[key].name ? base[key].name : "anon";
            funId = getValue(base[key])
            if (lst.indexOf(funId) > -1) {
              var indx = String(Number(key) - 1)
              addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [indx, null])
            }

          }
        }
      }
      if (isNative(f) && f === Array.prototype.unshift) {
        for (var key of Object.keys(args)) {
          var value = args[key]
          if (typeof value == "function") {
            funName = value.name ? value.name : "anon";
            funId = getValue(value)
            if (lst.indexOf(funId) > -1) {
              addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [String(key), null])
            }

          }
        }
        for (var key in base) {
          if (typeof base[key] == "function") {
            funName = base[key].name ? base[key].name : "anon";
            funId = getValue(base[key])
            var indx = String(Number(key) + args.length)
            if (lst.indexOf(funId) > -1) {
              addToTrace("Put", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), [indx, null])
            }

          }
        }
      }
      var funName = f.name
      if (isNative(f) && (f === Function.prototype.apply || f === Function.prototype.call)) {
        funName = base.name ? base.name : "anon"
        funId = getValue(base, SPECIAL_PROP_IID, SPECIAL_PROP_SID)
      }
      else {
        funName = f.name ? f.name : "anon"
        funId = getValue(f, SPECIAL_PROP_IID, SPECIAL_PROP_SID)
      }
      //|| funId.startsWith("FunNat:")
      if (lst.indexOf(funId) > -1 || funId.indexOf("FunNat:") === 0) {
        addToTrace("InvokeCall", funName, funId, getLoc("invkcll", J$.getGlobalIID(iid)))
      }
    },
    invokeFun: function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {

      if (isNative(f) && (f === Function.prototype.apply || f === Function.prototype.call)) {
        funName = base.name ? base.name : "anon"
        funId = getValue(base)

      }
      else {
        funName = f.name ? f.name : "anon"
        funId = getValue(f)
      }
      var list = null;
      if (typeof result == "function") {
        retName = result.name ? result.name : "anon";
        retId = getValue(result)
        retLoc = getLoc("invkfun", functionSid + ":" + functionIid);
        retLoc = retLoc === "None" ? getLoc("", getPropSafe(base, SPECIAL_PROP_SID) + ":" + getPropSafe(base, SPECIAL_PROP_IID)) : retLoc;
        var obj = {
          "retId": retId,
          "retName": retName,
          "retLoc": retLoc
        };
        if (list == null) {
          list = [];
          list.push(obj);
        }
      }
      //if(lst.indexOf(funId) > -1 || (list!==null && lst.indexOf(list[0]["retId"]) > -1)){
      if (lst.indexOf(funId) > -1) {
        addToTrace("InvokeReturn", funName, funId, getLoc("invkretrn", J$.getGlobalIID(iid)), list)
        //lst.splice(lst.indexOf(funId), 1);
        var lstCaller = lstMap[funId];
        if (lstCaller) {
          var lstCallees = J$.ast_info[lstCaller]
          if (lstCallees) {
            var lstCalleeInd = lstCallees.indexOf(getLoc("invkretrn", J$.getGlobalIID(iid)))
            if (lstCalleeInd > -1) {
              lstCallees.splice(lstCalleeInd, 1);
              if (lstCallees.length == 0) {
                delete J$.ast_info[lstCaller]
                lstKeys = Object.keys(J$.ast_info)
                lst.splice(lst.indexOf(funId), 1);
              } else {
                J$.ast_info[lstCaller] = lstCallees
              }
            }
          }
        }
      }
      else if (list !== null && lst.indexOf(list[0]["retId"]) > -1) {
        addToTrace("InvokeReturn", funName, funId, getLoc("invkretrn", J$.getGlobalIID(iid)), list)
        //lst.splice(lst.indexOf(list[0]["retId"]), 1);
      }
      if (isNative(f) && f === Array.prototype.pop) {
        var indx = String(base.length)
        if (typeof result == "function") {
          funName = result.name ? result.name : "anon";
          funId = getValue(result)
          if (lst.indexOf(funId) > -1) {
            addToTrace("Get", funName, funId, getLoc("invkretrn", J$.getGlobalIID(iid)), [indx, null])
          }

        }
      }

    },
    read: function (iid, name, val, isGlobal, isScriptLocal) {
      if (typeof val == 'function') {

        funName = val.name ? val.name : "anon"
        funId = getValue(val)
        if (lst.indexOf(funId) > -1) {
          //new to model variable uses inside eval/evalIndirect
          //if (frmToFunName[getFrameID(name)] && !frmToFunName[getFrameID(name)].indexOf("eval") === 0 && scriptSet.indexOf(getFrameID(name)) > -1 ){
          if (getFrameToFunName(J$.smemory.getShadowFrame(name)) && !getFrameToFunName(J$.smemory.getShadowFrame(name)).indexOf("eval") === 0 && scriptSet.indexOf(getFrameID(name)) > -1) {
            addToTrace("LocRead", funName, funId, getLoc("read", callStack[callStack.length - 1]), [getFrameID(name) + ":" + name, "Global", getLoc("read", callStack[callStack.length - 1])])
          }
          else if (getFrameID(name) !== getCurrentFrameID()) {
            //addToTrace("LexRead",funName,funId,frmToFunName[getFrameID(name)]==undefined?"None":frmToFunName[getFrameID(name)],[getFrameID(name)+":"+name,getCurrentFrameID(),getLoc("read",callStack[callStack.length-1])])
            addToTrace("LexRead", funName, funId, getFrameToFunName(J$.smemory.getShadowFrame(name)), [getFrameID(name) + ":" + name, getCurrentFrameID(), getLoc("read", callStack[callStack.length - 1])])
          } else {
            addToTrace("LocRead", funName, funId, getLoc("read", callStack[callStack.length - 1]), [getFrameID(name) + ":" + name, getCurrentFrameID(), getLoc("read", callStack[callStack.length - 1])])
          }
        }

      }
    },
    write: function (iid, name, val, lhs, isGlobal, isScriptLocal) {
      if (typeof val == 'function') {
        funName = val.name ? val.name : "anon"
        funId = getValue(val)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Write", funName, funId, getLoc("write", J$.getGlobalIID(iid)), getFrameID(name) + ":" + name) //temp frmToFunName[getFrameID(name)]
        }
      }
    },
    _return: function (iid, val) {
      if (typeof val == 'function') {
        funName = val.name ? val.name : "anon"
        funId = getValue(val)
        if (lst.indexOf(funId) > -1) {
          addToTrace("Return", funName, funId, getLoc("return", J$.getGlobalIID(iid)))
        }
      }
    },
    _with: function (iid, val) {
      if (typeof val == 'object' && val != null) {
        for (var key of Object.keys(val)) {
          var value = val[key]
          if (typeof value == "function") {
            funName = value.name ? value.name : "anon";
            funId = getValue(value)
            if (lst.indexOf(funId) > -1) {
              addToTrace("With", funName, funId, getLoc("literal", J$.getGlobalIID(iid)), String(key))
            }
          }
        }
      }
    },
    endExecution: function () {
      if (!isBrowser) {
        const fs = require('fs');
        const json = JSON.stringify(output, null, 2);
        console.log(json)
        filename = (process.argv[1]).replace('analysis', 'analysis_results').replace(/.js$/, "_trace.json");
        //console.log(filename)
        fs.writeFileSync(filename, json, 'utf8', function (err) {
          if (err) console.log('error', err);
        });
      } else {
        J$.CallTrace = output;
        return J$.CallTrace;
      }
    }
  };

})(J$);
