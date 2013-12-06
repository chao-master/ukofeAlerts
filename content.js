function pageFullyLoaded(){
        window.location.hash += " ";
        console.log("page Loaded")
    }

chrome.runtime.sendMessage({
    message:"pageLoad",
    url:window.location.pathname
},function(settings){
    var r=0;
    
    if (settings.squareAvatars){
        $("body").addClass("ukofea-squareAvatars");
    }
    if (settings.themeOverload.enabled){
        $("link[rel=stylesheet]").attr("href",function(i,h){return h.replace(/[0-9]+(?=&dir)/,settings.themeOverload.style)})
    }
    
    if (window.location.pathname.search("^/threads/[^/]+/[^/]+/?") == 0 && settings.retriveFirstPost){
        $("<li class='ukofea-firstFetched'>...Loading...</li>")
            .prependTo("#messageList")
            .load(window.location.pathname+"/.. #messageList>li:first",function(){
                $(this).children().unwrap().addClass("ukofea-firstFetched")
                if(settings.advLoadWait && !r){
                    pageFullyLoaded();
                }
            })
    }
    
    if (settings.advLoadWait){
        $("img").each(function(){
            if(!this.complete){
                r++;
                $(this).load(function(){
                    r--;
                    console.log(this.complete)
                    if(!r){
                        pageFullyLoaded();
                    }
                })
            }
            console.log(this.complete)
        })
        if (!r){
            pageFullyLoaded();
        }
    }
    
    if (settings.massSpoilerToggle){
    $("<div class='button'>Show All</div>")
        .css({display:"inline-block","margin-left":"10px"})
        .click(function(){
            $(".bbmSpoilerBlock:has(>.quotecontent>.bbm_spoiler[style='display: none;'],>.quotecontent>.bbm_spoiler:not([style]))>.type>.button:first-child").click()
        }).appendTo(".bbmSpoilerBlock>.type");
    $("<div class='button'>Hide All</div>")
        .css({display:"inline-block","margin-left":"10px"})
        .click(function(){
            $(".bbmSpoilerBlock:has(>.quotecontent>.bbm_spoiler[style='display: block;'])>.type>.button:first-child").click()
        }).appendTo(".bbmSpoilerBlock>.type");
    }
    
    if (settings.ignoreNotice){
        $(".ignored, .message:has(.messageNotices li:contains('ignoring'))").addClass('subIgnored').removeClass('ignored');
        $(".message .messageNotices li:contains('ignoring'), .messageSimple .messageNotices li:contains('ignoring')").text(function(i,t){return t.replace("this member",$(this).parents(".message, .messageSimple").attr("data-author"))});
        $(".message.subIgnored .messageNotices, .messageSimple .messageNotices li:contains('ignoring')").click(function(){$(this).closest(".message, .messageSimple").toggleClass("subIgnored")});
        $(".bbCodeQuote.subIgnored .attribution").click(function(){$(this).closest(".bbCodeQuote").toggleClass("subIgnored")});
    }
});
