chrome.runtime.sendMessage({message:"quickLoad"}, function(response) {
    $("#notifications").empty().append(response.html)
    $.each(response.settings.standard,function(k,v){
        addOption($("#options ul"),k,v,"standard.");
    })
    $.each(response.settings.hidden,function(k,v){
        addOption($("#experimental ul"),k,v,"hidden.");
    })
    
    $("#toggleOptions").click(function(){
        $("body").toggleClass("options")
    })
});

var c=[38,38,40,40,37,39,37,39,66,65],p=0;
$(window).keydown(function(e){
    if(c[p]==e.keyCode){
        p++;
        if(p==c.length){
            $("#experimental").css("display","block");
            $(this).unbind("keydown",arguments.callee);
        }
    }else{
        p=0;
    }
})

function addOption(to,key,value,path){
    var type = typeof(value);
    var obj;
    if (type == "object"){
        obj = $("<ul>").appendTo("<li><header>"+key+"</header></li>");
        $.each(value,function(k,v){
            addOption(obj,k,v,path+key+".");
        });
    } else {
        obj = $("<input>");
        if (type == "boolean") {
            obj.attr("type","checkbox").attr('checked', value).click(function(){
                var s = {},t=$(this);
                s[t.attr("data-key")] = t.prop("checked");
                chrome.storage.local.set(s);
            });
        } else {
            obj.attr("type",type).val(value).change(function(){
                var s = {},t=$(this);
                s[t.attr("data-key")] = t.val();
                chrome.storage.local.set(s);
            })
        }
        obj = obj.attr("data-key",path+key).appendTo("<label>"+key+": </label>");
        obj.parent().appendTo("<li>")
    }
    obj.closest("li").appendTo(to);
}

$(window).unload(function(){
    chrome.runtime.sendMessage({message:"reLoad"})
});
