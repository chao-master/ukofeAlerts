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
var token;
var fetchToken = false;

function processCount(n){
    processing -= 1;
    count += n;
    chrome.browserAction.setBadgeText({text:""+count})
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
        var e = elem.find(".PopupItemLink")
        $("#alerts ul").append($("<li>").append(
            e.attr("class","").attr("target","_blank").attr("title",e.text())
        ))
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
    //TODO update badge
}

$("body").append(
'        <section id="conversations">'+
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
    
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request == "quickLoad"){
        sendResponse($("body").html());
    } else if (request == "reLoad"){
        checkAll()
    }
});

checkAll()
setInterval(checkAll,60*1000*5)
