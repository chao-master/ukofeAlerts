function xfRequestPage(url,data,callback) {
    if (!token){
        fetchToken = true;
        $.post("http://ukofequestria.co.uk",{},function(resp){
            token = $(resp).find("input[name=_xfToken]").attr("value")
            xfRequestPage(url,data,callback)
        });
    } else {
        $.extend(data,{"_xfNoRedirect":1,"_xfResponseType":"json","_xfToken":token});
        $.get(url,data,function(resp){
            callback($($.parseHTML(resp.templateHtml)),resp.error);
        },"json");
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
            data.find(".unread.discussionListItem,.primaryContent.new").each(function(){
                addFunc($(this))
            });
            var amount = data.find(".unread.discussionListItem,.primaryContent.new").length;
            if (amount >= 20 && page != 0){
                checkThreadList(url,page+1,addFunc);
            }
            console.log(url,page,amount)
            processCount(amount);
        } else {
            console.error(err);
        }
    });
}

function checkConversations(){
    $("#conversations ul").empty();
    $("#conversations").addClass("nothing")
    checkThreadList("http://ukofequestria.co.uk/conversations",1,function(elem){
        var e = elem.find(".title a");
        e.find(".prefix").remove()
        $("#conversations ul").append($("<li>").append(
            e.attr("class","").attr("target","_blank").attr("title",e.text())
        ))
    });
}
function checkAlerts(c){
    $("#alerts ul").empty();
    $("#alerts").addClass("nothing")
    checkThreadList("http://ukofequestria.co.uk/account/alerts",1,function(elem){
        var e = elem.find(".alertText h3")
        e.find("a").attr("target","_blank")
        $("#alerts ul").append($("<li>").append(e).attr("title",e.text().replace(/\s+/g," "))
        e.find("*:first-child").unwrap()
    });
}
function checkWatched(){
    $("#watched ul").empty();
    $("#watched").addClass("nothing")
    checkThreadList("http://ukofequestria.co.uk/watched/threads",0,function(elem){
        var e = elem.find(".PreviewTooltip")
        $("#watched ul").append($("<li>").append(
            e.attr("class","").attr("target","_blank").attr("title",e.text())
        ))
    });
}

function checkAll(){
    processing = 0;
    count = 0;
    checkConversations();
    checkAlerts();
    checkWatched();
}

function contentPageLoaded(url){
    var s = url.split("/");
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
        lastCount = count
        if (count){
            chrome.browserAction.setBadgeText({text:""+count});
        } else {
            chrome.browserAction.setBadgeText({text:""});
        }
        if (!processing){
            spinIcon();
        }
    }
}

$("body").append(
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
'    </section>')

var iconImg = $('<img src="icon19.png"/>')[0]

chrome.browserAction.setIcon({path:"icon19.png"}) //WTF chrome
    
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.message == "quickLoad"){
        sendResponse($("body").html());
    } else if (request.message == "reLoad"){
        checkAll()
    } else if (request.message == "pageLoad"){
        contentPageLoaded(request.url);
    }
});

localSettings = {
    squareAvatars:true
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  $.extend(localSettings,items)
});

chrome.storage.get(null,function(items){
    $.extend(localSettings,items)
}

checkAll()
setInterval(checkAll,60*1000*5) //TODO use chrome API insted
