chrome.runtime.sendMessage({
    message:"pageLoad",
    url:window.location.pathname
},function(settings){
    if (settings.squareAvatars){
        $("body").addClass("ukofea-squareAvatars");
    }
    if (settings.themeOverload.enabled){
        $("link[rel=stylesheet]").attr("href",function(i,h){return h.replace(/[0-9]+(?=&dir)/,settings.themeOverload.style)})
    }
});
