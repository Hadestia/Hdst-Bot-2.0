/* eslint-disable linebreak-style */
"use strict";

async function getUIDSlow(url) {
    var FormData =  require("form-data");
    var Form = new FormData();
	var Url = new URL(url);
    Form.append('username', Url.pathname.replace(/\//g, ""));
	try {
        var data = await fetch('https://api.findids.net/api/get-uid-from-username',{
            body: Form,
            headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.79 Safari/537.36'
			}
        })
	} catch (e) {
    	return console.log(e);
	}
    if (JSON.parse(data.body.toString()).status != 200) return console.log('getID api not responding');
    if (typeof JSON.parse(data.body.toString()).error === 'string') return "error"
    else return JSON.parse(data.body.toString()).data.id || "garters";
}

async function getUIDFast(url) {
    var FormData =  require("form-data");
    var Form = new FormData();
	var Url = new URL(url);
    Form.append('link', Url.href);
    try {
        var data = await fetch('https://id.traodoisub.com/api.php',{
            body: Form
        })
	} catch (e) {
        return console.log(e);
	}
    if (JSON.parse(data.body.toString()).error) return api.sendMessage(JSON.parse(data.body.toString()).error,global.Fca.Data.event.threadID,global.Fca.Data.event.messageID);
    else return JSON.parse(data.body.toString()).id || "???";
}

async function getUID(url) {
    var getUID = await getUIDFast(url);
        if (!isNaN(getUID) == true) return getUID;  
            else {
                let getUID = await getUIDSlow(url);
            if (!isNaN(data) == true) return getUID;
        else return null;
    }
}

module.exports = function ({ api, event }) {
    return function getUID(link, callback) {
      var resolveFunc = function () { };
      var rejectFunc = function () { };
      var returnPromise = new Promise(function (resolve, reject) {
        resolveFunc = resolve;
        rejectFunc = reject;
      });
  
      if (!callback) {
        callback = function (err, uid) {
          if (err) return rejectFunc(err);
          resolveFunc(uid);
        };
      }
      
    try {
        var Link = String(link);
        var FindUID = getUID;
        if (Link.includes('facebook.com') || Link.includes('Facebook.com') || Link.includes('fb')) {
            var LinkSplit = Link.split('/');
            if (LinkSplit.indexOf("https:") == 0) {
              if (!isNaN(LinkSplit[3]) && !Link.split('=')[1]  && !isNaN(Link.split('=')[1])) {
                api.sendMessage('Invalid link, must follow: facebook.com/mensaherong.iantot', event.threadID , event.messageID);
                callback(null, String(4));
              }
              else if (!isNaN(Link.split('=')[1]) && Link.split('=')[1]) {
                var Format = `https://www.facebook.com/profile.php?id=${Link.split('=')[1]}`;
                FindUID(Format,api).then(function (data) {
                  callback(null, data);
                });
              } 
              else {
                FindUID(Link,api).then(function (data) {
                  callback(null, data);
                });
              }
            }
            else {
                var Form = `https://www.facebook.com/${LinkSplit[1]}`;
                FindUID(Form,api).then(function (data) {
                    callback(null, data);
                });
            }
        }
        else {
            callback(null, null);
            api.sendMessage('Invalid link.', event.threadID, event.messageID)
        }
    }
    catch (e) {
      return callback(null, e);
    }
    return returnPromise;
   };
 };