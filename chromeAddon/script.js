function xfRequestPage(url,data,callback) {

    function error(jqXHR,err,b){
        $("#errors ul").append($("<li>").text(b+" whilst loading "+url));
        $("#errors").removeClass("nothing")
        console.error(jqXHR,err,b);
    }

    if (!token){
        fetchToken = true;
        $.post("http://ukofequestria.co.uk",{},function(resp){
            token = $(resp.replace(/<img\b[^>]*>/ig, '')).find("input[name=_xfToken]").attr("value")
            xfRequestPage(url,data,callback)
        }).fail(error);
    } else {
        $.extend(data,{"_xfNoRedirect":1,"_xfResponseType":"json","_xfToken":token});
        $.get(url,data,function(resp){
            callback($($.parseHTML(resp.templateHtml.replace(/<img\b[^>]*>/ig, ''))),resp.error);
        },"json").fail(error);
    }
}

var processing = 0;
var count = 0;
var lastCount = 0;
var token;
var fetchToken = false;

function processCount(n){
    processing -= 1;
    count += n;
    updateBadge()
}

function addThread(section,title,link){
    $(section+" ul").append(
        $("<li>").append( $("<a>").text(title).attr("href",link))
    )
}

function checkThreadList(url,page,addFunc){
    processing += 1;
    xfRequestPage(url,{"page":page},function(data,err){
        if (!err){
            var added = 0;
            data.find(".unread.discussionListItem,.primaryContent.new").each(function(){
                added += addFunc($(this));
            });
            var amount = data.find(".unread.discussionListItem,.primaryContent.new").length;
            if (amount >= 20 && page != 0){
                checkThreadList(url,page+1,addFunc);
            }
            processCount(added);
        } else {
            console.error(err);
        }
    });
}

function checkConversations(){
    $("#conversations ul").empty();
    $("#conversations").addClass("nothing")
    checkThreadList("http://ukofequestria.co.uk/conversations",1,function(elem){
        var e = elem.find(".title a.PreviewTooltip");
        $("#conversations ul").append($("<li>").append(
            e.attr("class","").attr("target","_blank").attr("title",e.text())
        ))
        $("#conversations").removeClass("nothing")
        return true;
    });
}
function checkAlerts(c){
    $("#alerts ul").empty();
    $("#alerts").addClass("nothing")
    checkThreadList("http://ukofequestria.co.uk/account/alerts",1,function(elem){
        var e = elem.find(".alertText h3")
        e.find("a").attr("target","_blank")
        
        var alertFilter = localSettings.get("standard.Alert Filtering");
        if (alertFilter.Enabled) {
            var ce = e.clone();
            ce.children().remove();
            var idenityText = ce.text().match(/\S+/)[0];
            var keep = true;
            switch(idenityText){
                case "replied":
                    keep = !alertFilter["Hide Replies"];
                    break;
                case "quoted":
                    keep = !alertFilter["Hide Quotes"];
                    break;
                case "tagged":
                    keep = !alertFilter["Hide Tags"];
                    break;
                case "commented":
                    keep = !alertFilter["Hide Profile Replies"];
                    break;
                case "wrote":
                    keep = !alertFilter["Hide Profile Messages"];
                    break;
            }
            if (!keep){return false}
        }
        
        $("#alerts").removeClass("nothing")
        $("#alerts ul").append($("<li>").append(e).attr("title",e.text().replace(/\s+/g," ")))
        e.find("*:first-child").unwrap()
        return true;
    });
}
function checkWatched(){
    $("#watched ul").empty();
    $("#watched").addClass("nothing")
    
    if(localSettings.get("standard.Show Watched Threads")){
        $("#watched").css("display","block");
        checkThreadList("http://ukofequestria.co.uk/watched/threads",0,function(elem){
            $("#watched").removeClass("nothing")
            var e = elem.find(".PreviewTooltip")
            $("#watched ul").append($("<li>").append(
                e.attr("class","").attr("target","_blank").attr("title",e.text())
            ))
            return true;
        });
    } else {
        $("#watched").css("display","none");
    }
}

function checkAll(){
    $("#errors ul").empty();
    $("#errors").addClass("nothing");
    processing = 0;
    count = 0;
    checkConversations();
    checkAlerts();
    checkWatched();
}

function contentPageLoaded(url,lastPage){
    if (lastPage){
        var s = url.split("/");
        if (s.length < 2){return}
        var type = s[1];
        var id = s[2].match(/[0-9]+$/)[0]
        var remed = $("li").filter(function(){
            var t = $(this).find("a").attr("href").split("/");
            return t[0] == type && t[1].indexOf(id, t[1].length - id.length) !== -1;
        })
        if(remed.length){
            count -= remed.length;
            updateBadge()
            remed.remove()
            spinIcon()
            $("#notifications>section>ul:empty").parent().addClass(".nothing")
        }
    }
}

function updateIcon(angle,faded){
    var cvs = $('<canvas width="19" height="19"></canvas>')[0]
    var ctx = cvs.getContext("2d")
    ctx.translate(8,8)
    ctx.rotate(angle*Math.PI / 180)
    ctx.drawImage(iconImg,-8,-8)
    chrome.browserAction.setIcon({imageData:{"19":ctx.getImageData(0,0,19,19)}})
}

var spinning=false;
function spinIcon(speed){
    if (spinning) return;
    var rot=0;
    spinning=true;
    var rFn = function(){
        rot+=9;
        updateIcon(rot,false);
        if (rot<360 && spinning){
            setTimeout(rFn,500/80);
        } else {
            updateIcon(0,false)
            spinning = false
        }
    }
    rFn()
}

function updateBadge(){
    if (count != lastCount){
        if (count){
            chrome.browserAction.setBadgeText({text:""+count});
        } else {
            chrome.browserAction.setBadgeText({text:""});
        }
        if (!processing){
            if (lastCount < count && localSettings.get("standard.Notification Sounds")){
                alertSoundElem.play()
            }
            spinIcon();
            lastCount = count
        }
    }
}

$("body").append(
'    <article id="notifications">'+
'    <section id="errors" class="nothing">'+
'        <h1><i class="fa fa-times"></i> Errors</h1>'+
'        <ul></ul>'+
'    </section>'+
'    <section id="conversations">'+
'        <h1><i class="fa fa-envelope"></i> Conversations</h1>'+
'        <ul></ul>'+
'    </section>'+
'    <section id="alerts">'+
'        <h1><i class="fa fa-bell"></i> Alerts</h1>'+
'        <ul></ul>'+
'    </section>'+
'    <section id="watched">'+
'        <h1><i class="fa fa-eye"></i> Watched Threads</h1>'+
'        <ul></ul>'+
'    </section></article>')

var iconImg = $('<img src="icon19.png"/>')[0]

chrome.browserAction.setIcon({path:"icon19.png"}) //WTF chrome
    
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.message == "quickLoad"){
        sendResponse({html:$("#notifications").html(),settings:localSettings.get("")});
    } else if (request.message == "reLoad"){
        checkAll()
    } else if (request.message == "pageLoad"){
        sendResponse(localSettings.get(""));
        contentPageLoaded(request.url,request.lastPage);
    }
});


var alertSoundElem = $("<audio>").attr("src","alert.ogg").appendTo("body")[0]

setInterval(checkAll,60*1000*5) //TODO use chrome API insted

localSettings = new BasicSettings({
    standard:{
        "Notification Sounds":true,
        "Show Watched Threads":true,
        "Alert Filtering":{
            "Enabled":false,
            "Hide Replies":true,
            "Hide Quotes":false,
            "Hide Tags":false,
            "Hide Profile Replies":false,
            "Hide Profile Posts":false
        }
    },
    hidden:{
        retriveFirstPost:false,
        advLoadWait:false,
        massSpoilerToggle:false,
        ignoreNotice:false,
        squareAvatars:false,
        themeOverload:{
            enabled:false,
            style:5249
        },
        miniMode:{
            forumGames:false,
            fullSite:false,
        }
    }
},function(){
    checkAll()
})

chrome.storage.onChanged.addListener(function(changes, namespace) {
    $.each(changes,function(k,v){
        localSettings.set(k,v.newValue);
    })
});

