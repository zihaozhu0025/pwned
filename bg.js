// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
 
var lastMessage = "";

function scan(url) {
  //function to get the domain name from the site
  function url_domain(data) {
    var    a      = document.createElement('a');
           a.href = data;
    var noWWW = a.hostname.replace('www.', '');
    return noWWW;
  }
  
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  //send a request to haveibeenpwned checking if the site has been breached
  suffurl = url_domain(url);
  url = suffurl.substring(0, suffurl.lastIndexOf('.'));
  var pwnCheck = new XMLHttpRequest();
  pwnCheck.open("GET", "https://haveibeenpwned.com/api/v2/breach/"+url, false);
  pwnCheck.send();
  if(pwnCheck.status == 200) {
    pwnCheck = JSON.parse(pwnCheck.responseText);
    leakSize = pwnCheck.PwnCount;
    leakDate = new Date(pwnCheck.BreachDate);
    leakedInfo = pwnCheck.DataClasses;
    isVerified = pwnCheck.IsVerified;
    isSensitive = pwnCheck.IsSensitive;
    isActive = pwnCheck.IsActive;
    isRetired = pwnCheck.IsRetired;
    
    //Output string processing
    infoString = "";
    if(leakedInfo.length == 1) {
      infoString = leakedInfo[0].toLowerCase();
    } else {
      for(var i = 0; i < leakedInfo.length-1; i++) {
        infoString += (leakedInfo[i].toLowerCase() + ", ");
      }
      infoString += "and " + leakedInfo[i].toLowerCase();
    }
    output = "On " + monthNames[parseInt(leakDate.getMonth()+1)] + " " + leakDate.getDate() + ", "+ leakDate.getFullYear() + ", " + leakSize.toLocaleString() + "\n" + infoString + "\nwere leaked from " + suffurl + ". \n";
    if(isVerified)
      output += "This leak has been verified.";
    else
      output += "This leak has not been verified.";
    return [getSeverity(leakSize, leakDate, isVerified, isSensitive), output];
  }
  return [1, suffurl + " looks safe!\nThere is no recorded leak\nor security breach we could find."];
}

function getSeverity(leakedSize, leakDate, isVerified, isSensitive) {
  var severityScore = 0;
  if(leakedSize > 10000000) {
  	severityScore += 3;
  } else if(leakedSize > 1000000) {
  	severityScore += 2;
  } else {
    severityScore += 1;
  }
  var currentDate = new Date();
  var howRecent = currentDate - leakDate;
  var secsInDay = 86000;
  if(howRecent < secsInDay * 30) {
  	severityScore += 3;
  } else if(howRecent < secsInDay * 365) {
  	severityScore += 2;
  } else if(howRecent < secsInDay * 2 * 365) {
  	severityScore += 1;
  }
  
  if(!isVerified) {
  	severityScore -= 1;
  }
  if(isSensitive) {
  	severityScore += 2;
  }
  return Math.max(2, Math.min(severityScore, 5));
}


 
function getCurrentTabUrl(scan_callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;
    var result = scan(url);
    assignIcon(Math.max(1, Math.min(result[0], 4)));
    lastMessage = result[1];
    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function evalthreat(callback) {}
function assignIcon(threatLevel) {
	var icons = ["good", "neutral","debatable", "bad", "dead"];
	chrome.browserAction.setIcon({path:icons[threatLevel-1] + ".svg"});
}
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    getCurrentTabUrl(scan);
});

chrome.tabs.onCreated.addListener(function(tab) {
   getCurrentTabUrl(scan);
});
chrome.tabs.onActivated.addListener(function(tab) {
   getCurrentTabUrl(scan);
});
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "hello")
      sendResponse({farewell: lastMessage});
  });
