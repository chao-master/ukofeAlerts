function BasicSettings(settings,ready) {
    function loop(over, path) {
        var rtn = {};
        $.each(over, function(key, val) {
            var typ = typeof (val), 
            nval = {
                "type": typ,
                "path": path + key
            };
            if (typ == "object") {
                nval.value = loop(val, path + key + ".");
            } else {
                nval.value = undefined;
                nval.def = val;
            }
            rtn[key] = nval;
        })
        return rtn;
    }
    
    var _s = loop(settings, "");
    
    var that = this;
    chrome.storage.local.get(null,function(res){
        $.each(res,function(k,v){
            that.set(k,v,true)
        })
        ready()
    })
    
    function evalPath(path) {
        var pathEl = path.split(".");
        var curTar = {
            value: _s,
            type: "object"
        };
        if (path == "") {
            return curTar;
        }
        for (var i = 0; i < pathEl.length; i++) {
            curTar = curTar.value[pathEl[i]];
            if (curTar === undefined) {
                return {
                    value: undefined,
                    type: "undefined"
                }
            }
        }
        return curTar;
    }
    
    this.get = function(path) {
        var lkup = evalPath(path);
        if (lkup.type != "object") {
            return lkup.value==undefined?lkup.def:lkup.vale;
        }
        function loop(over) {
            var rtn = {};
            $.each(over, function(k, v) {
                if (v.type == "object") {
                    rtn[k] = loop(v.value)
                } else {
                    rtn[k] = v.value==undefined?v.def:v.vale
                }
            })
            return rtn;
        }
        return loop(lkup.value)
    }
    
    this.set = function(path, value,noStore) {
        var aply = evalPath(path);
        if(value==undefined){
            aply.value = undefined;
        } else {
            switch (aply.type) {
                case "undefined":
                    throw new Error("Setting: " + path + " dose not exist");
                    break;
                case "object":
                    throw new Error("Cannot set: " + path + " as it is an object");
                    break;
                case "number":
                    aply.value = value * 1;
                    break
                case "boolean":
                    aply.value = typeof(value)=="string"?value.toLowerCase()=="true":value;
                    break;
                default:
                    aply.value = value;
                    break;
            }
        }
        if(!noStore){
            var toSet = {};
            toSet[aply.path] = aply.value;
            chrome.storage.local.set(toSet);
        }
    }
}

