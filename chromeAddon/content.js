function pageFullyLoaded(){
        window.location.hash += " ";
        console.log("page Loaded")
    }

chrome.runtime.sendMessage({
    message:"pageLoad",
    url:window.location.pathname,
    lastPage:$(".postsRemaining").length == 0
},function(settings){
    var r=0;
    
    if (settings.hidden.squareAvatars){
        $("body").addClass("ukofea-squareAvatars");
    }
    
    if (settings.hidden.miniMode.fullSite){
        $("body").addClass("ukofea-mini");
    } else if (settings.hidden.miniMode.forumGames && $(".crumb:last span").text() == "Forum Games and Randomness"){
        $("body").addClass("ukofea-mini");
    }
    
    if (settings.hidden.themeOverload.enabled){
        $("link[rel=stylesheet]").attr("href",function(i,h){return h.replace(/[0-9]+(?=&dir)/,settings.hidden.themeOverload.style)})
    }
    
    if (window.location.pathname.search("^/threads/[^/]+/[^/]+/?") == 0 && settings.hidden.retriveFirstPost){
        $("<li class='ukofea-firstFetched'>...Loading...</li>")
            .prependTo("#messageList")
            .load(window.location.pathname+"/.. #messageList>li:first",function(){
                $(this).children().unwrap().addClass("ukofea-firstFetched")
                if(settings.hidden.advLoadWait && !r){
                    pageFullyLoaded();
                }
            })
    }
    
    if (settings.hidden.advLoadWait){
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
    
    //Mass Spoiler Togglings
    if (settings.hidden.massSpoilerToggle){
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
    
    //Ignore Notices
    if (settings.hidden.ignoreNotice){
        $(".ignored, .message:has(.messageNotices li:contains('ignoring'))").addClass('subIgnored').removeClass('ignored');
        $(".message .messageNotices li:contains('ignoring'), .messageSimple .messageNotices li:contains('ignoring')").text(function(i,t){return t.replace("this member",$(this).parents(".message, .messageSimple").attr("data-author"))});
        $(".message.subIgnored .messageNotices, .messageSimple .messageNotices li:contains('ignoring')").click(function(){$(this).closest(".message, .messageSimple").toggleClass("subIgnored")});
        $(".bbCodeQuote.subIgnored .attribution").click(function(){$(this).closest(".bbCodeQuote").toggleClass("subIgnored")});
    }
    
    //Hash tags
    if (settings.hidden.hashTags){
        var HASHTAG = /#\w+/;
        var COMPTAG = /#\w+|[^#]+|#\W+/g;
        $(".messageContent *,.signature *").contents().filter(function(){
            return this.nodeType == Node.TEXT_NODE && HASHTAG.test(this.data);
        }).each(function(){
            console.log("Point A")
            var txt = this.data.match(COMPTAG);
            console.log("Point B")
            var rpc = $.map(txt,function(v){
                if (HASHTAG.test(v)){
                    console.log("Point Ca")
                    return $("<a>").attr("href","http://ukofequestria.co.uk/search/search?keywords="+encodeURIComponent(v)).text(v)[0]
                }
                console.log("Point Cb")
                return $(document.createTextNode(v))[0]
            })
            console.log(rpc)
            $(this).replaceWith($(rpc))
        })
    }
    
});
