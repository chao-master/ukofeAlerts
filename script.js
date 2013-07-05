function xfRequestPage(url,data,callback) {
    chrome.cookies.get({"url":url,"name":"ukofe_user"},function(cookie){
        $.extend(data,{"_xfNoRedirect":1,"_xfResponseType":"json","_xfToken":cookie.value});
        $.get(url,data,function(data){
            callback($($.parseHTML(data.templateHTML)[0]),data.error === undefined);
        },"json");
    });
}

var processing = 0;
var count = 0;
function processCount(n){
    processing -= 1;
    count += n;
    //TODO update badge
}

function addThread(section,title,link){
    $(section).append($("<a>").text(title).attr("href",link))
}

function checkThreadList(url,page,section){
    processing += 1;
    xfRequestPage(url,{"page":page},function(data,err){
        if (!err){
            if (section){
                data.find(".unread.discussionListItem,.primaryContent.new").each(function(){
                    addThread(section,$(this).find(".title a").text(),$(this).find(".title a").attr("href"));
                });
            }
            var amount = data.find(".discussionListItem").length;
            if (amount >= 20 and page != 0){
                checkThreadList(url,page+1,section);
            }
            processCount(amount);
        }
    });
}

function checkConversations(countOnly){
    if (!countOnly){$(".conversations").empty();}
    checkThreadList("http://ukofequestria.co.uk/conversations",1,countOnly?false:".conversations");
}
function checkAlerts(countOnly){
    if (!countOnly){$(".alerts").empty();}
    checkThreadList("http://ukofequestria.co.uk/account/alerts",1,countOnly?false:".alerts");
}
function checkWatched(countOnly){
    if (!countOnly){$(".watched").empty();}
    checkThreadList("http://ukofequestria.co.uk/watched/threads",0,countOnly?false:".watched");
}

function checkAll(countOnly){
    processing = 0;
    count = 0;
    checkConversations(countOnly);
    checkAlerts(countOnly);
    checkWatched(countOnly);
    //TODO update badge
}
