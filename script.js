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
    $(section).append(
        $("<li>").append( $("<a>").text(title).attr("href",link))
    )
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
            var amount = data.find(".unread.discussionListItem,.primaryContent.new").length;
            if (amount >= 20 && page != 0){
                checkThreadList(url,page+1,section);
            }
            console.log(url,page,amount)
            processCount(amount);
        } else {
            console.error(err);
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

checkAll($("body").length)
