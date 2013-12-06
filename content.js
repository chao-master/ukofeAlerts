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
    if (window.location.pathname.search("^/threads/[^/]+/[^/]+/?") == 0 && settings.retriveFirstPost){
        $("<li class='ukofea-firstFetched'>...Loading...</li>")
            .prependTo("#messageList")
            .load(window.location+"/.. #messageList>li:first",function(){$(this).children().unwrap().addClass("ukofea-firstFetched")})
    }
});
