"use strict";

const fs      = require("fs")
     ,path    = require("path")
     ,clock   = (function(){
                  const records = {};
                  function start(label, prefix){
                    label  = (label  || "");
                    prefix = (prefix || "");
                    records[label] = Number(new Date());
                    console.log("[START] " + label);
                  }
                  function now(label, prefix){
                    var time;
                    label  = (label  || "");
                    prefix = (prefix || "");
                    time = Number(new Date());
                    time = time - records[label];
                    time = Math.round(time / 1000); //loose some accuracy-scope -converting to seconds.
                    time = Math.max(time, 1);       //minimum is "1 sec."
                    console.log("[DONE]  " + label + " (" + time + " sec.)");
                  }
                  return { "records" : records
                          ,"start"   : start
                          ,"now"     : now
                         };
                }())
     ;



const filenames = ["_raw__hosts.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_hide.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_block.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_block_inline_script.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_style_inject.txt"
                  ]
   ,files       = filenames.map(function(filename){ return path.resolve("." + path.sep + filename);  })
   ,dates       = files.map(function(file){
                    const stat = fs.lstatSync(file);
                    return {atime:                Math.floor(stat.atime.getTime() / 10000)*10
                           ,mtime:                Math.floor(stat.mtime.getTime() / 10000)*10
                           ,mtime_iso:  (new Date(Math.floor(stat.mtime.getTime() / 10000)*10000)).toISOString().replace(/\.\d+Z/,".000Z")  //loose millisecond precision. 1. Since setting it uses OS' utime (either linux-native or lib-windows) which is has only second-precision.   2. Since the date printed as information (and the overall checksum) DOES include the changing milliseconds, which means that it keeps rendering new build with different dates, although nothing has changed, but the running of new build in different time...  An alternative is to use constant value: .replace(/\.\d\d\dZ/,".123Z") but there is no much point for that, since milliseconds are ISO supported but non-obliging in any way :] .
                           };
                  })
    ;

var  contents   = files.map(function(file){  return fs.readFileSync(file,{encoding: "utf8"}).replace(/\r/gm,"");  });



clock.start("~~");



(function(index){                                              //HOSTS content-fix.
  clock.start("  fix invalid HOSTS items");


  var REGEX_INVALID_HOSTS_BAD_ASCII   = /^.*[^a-z\d\-\_\.\n]+.*$/igm   //not allowed Unicode/UTF-8 letters.
     ,REGEX_INVALID_HOSTS_BAD_START   = /^[^a-z\d]+/igm                //non alphanumeric at the start, remove bad part.
     ,REGEX_INVALID_HOSTS_BAD_END     = /[^a-z\d]+$/igm                //non alphanumeric at the end, remove bad part.
     ,REGEX_INVALID_HOSTS_IP_LIKE     = /^[\d\.]+$/igm                 //blocking an IP-like domains can be done in  '_raw__hosts_adblock_anti_annoyances_block', native HOSTS-file does not support it. Fix by removing the entire-line.
     ,REGEX_INVALID_HOSTS_NO_DOT      = /^[^\.]*$/igm                  //'no dot in line' or empty line, fix by removing the entire-line.
     ,REGEX_INVALID_HOSTS_WHITESPACE  = /[\ \t]+/igm                   //space/tab, fix by removing invalid-part.
     ,REGEX_INVALID_HOSTS_DOUBLE_DOT  = /\.\.+/igm                     //double dot, fix by removing invalid-part.
     ,REGEX_INVALID_HOSTS_DASH_MUCH   = /^.*\-\-\-+.*$/igm             //domains with 3+ dash-characters, fix by removing the entire-line.
     ,REGEX_TOO_LONG                  = /^..................................................+$/igm //remove all lines with 50+ characters.

     ,REGEX_DONTCARE_HOSTS1           = /^(support|discuss|doc|wiki|guide|help|communit).{0,3}\..+/igm  //community, communities, doc, docs - (removed blog, blogs, and forum, forums) any support/documents/wiki subdomain can be indicate a safe domain, which can be removed. there is a 'free' possible-suffix of up to 2 characters (doc/docs/community/communities/..).
     ,REGEX_DONTCARE_HOSTS2           = /^(kb)\..+/igm  //kb pages (help). a specific fix.
     ,REGEX_UNBLOCK_DOMAINS           = /^(s3\.amazonaws\.com|www\.s3\.amazonaws\.com|github\.com|www\.github\.com|raw\.githubusercontent\.com|www\.raw\.githubusercontent\.com|gist\.githubusercontent\.com|www\.gist\.githubusercontent\.com)$/igm        //those keeps comming back, since the next part removes 'www.' (if the 'www.github','www._____' will not be removed as well), merge those with the existing list again. should add any common-prefix we are going to add ('wss.', 'ws.', ...  - I've simply disabled those so I don't care about adding the 'anti-filter' for now). they are commonly used as hosting many websites - I to specifically verify they would not be included.

  index    = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].toLowerCase();

  contents[index] = contents[index].replace(REGEX_INVALID_HOSTS_BAD_ASCII,    "")
                                   .replace(REGEX_INVALID_HOSTS_BAD_START,    "")
                                   .replace(REGEX_INVALID_HOSTS_BAD_END,      "")
                                   .replace(REGEX_INVALID_HOSTS_IP_LIKE,      "")
                                   .replace(REGEX_INVALID_HOSTS_NO_DOT,       "")
                                   .replace(REGEX_INVALID_HOSTS_WHITESPACE,   "")
                                   .replace(REGEX_INVALID_HOSTS_DOUBLE_DOT,  ".")
                                   .replace(REGEX_INVALID_HOSTS_DASH_MUCH,    "")
                                   .replace(REGEX_TOO_LONG,                   "")
                                   .replace(REGEX_DONTCARE_HOSTS1,            "")
                                   .replace(REGEX_DONTCARE_HOSTS2,            "")
                                   .replace(REGEX_UNBLOCK_DOMAINS,            "")
                                   ;
  clock.now("  fix invalid HOSTS items");
}());



(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('www.',...)");

  var REGEX_START_WITH_WWW      = /^www\./igm               //starts with www.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'www.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WWW  = /^www\..+\..+\..+\..+.*$/igm  //'www.' + 3 dots + 4 parts. - removing too-long lines to save file-size (those will be kept: 'www.0.disquscdn.com' but also 'www.good.co.il', those will be deleted 'www.wss.good.co.il').
     ,REGEX_WWWDOT_FIX          = /^.*www\.$/igm            //line that ends with 'www.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WWW, "") //chains of www.www.www. ?
                                   .replace(REGEX_START_WITH_WWW, "")
                                   .replace(REGEX_START_WITH_WWW, "")
                                   ;

  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "www.")
                  ;
  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WWW, "") //remove lines that are already subdomains starting with 'www'
  contents[index] = contents[index].replace(REGEX_WWWDOT_FIX,         "") //remove lines that ends with 'www.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('www.',...)");
}());



/*
(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('ws.',...)");

  var REGEX_START_WITH_WS      = /^ws\./igm               //starts with ws.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'ws.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WS  = /^ws\..+\..+\..+.*$/igm  //'ws.' + 2 dots + 3 parts. - removing too-long lines to save file-size (for example 'ws.0.disquscdn.com').
     ,REGEX_WSDOT_FIX          = /^.*ws\.$/igm            //line that ends with 'ws.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WS, "") //chains of ws.ws.ws. ?
                                   .replace(REGEX_START_WITH_WS, "")
                                   .replace(REGEX_START_WITH_WS, "")
                                   ;
  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "ws.")
                  ;

  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WS, "") //remove lines that are already subdomains starting with 'ws'
  contents[index] = contents[index].replace(REGEX_WSDOT_FIX,         "") //remove lines that ends with 'ws.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('ws.',...)");
}());

*/

/*
(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('wss.',...)");

  var REGEX_START_WITH_WSS      = /^wss\./igm               //starts with wss.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'wss.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WSS  = /^wss\..+\..+\..+.*$/igm  //'wss.' + 2 dots + 3 parts. - removing too-long lines to save file-size (for example 'wss.0.disquscdn.com').
     ,REGEX_WSSDOT_FIX          = /^.*wss\.$/igm            //line that ends with 'wss.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WSS, "") //chains of wss.wss.wss. ?
                                   .replace(REGEX_START_WITH_WSS, "")
                                   .replace(REGEX_START_WITH_WSS, "")
                                   ;
  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "wss.")
                  ;

  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WSS, "") //remove lines that are already subdomains starting with 'wss'
  contents[index] = contents[index].replace(REGEX_WSSDOT_FIX,         "") //remove lines that ends with 'wss.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('wss.',...)");
}());
*/


(function(){                                                     //removing short links
  clock.start("  removing OK-short-links");
  var regex_ok_short_links = /^(0rz.tw|1link.in|1url.com|2.gp|2big.at|2tu.us|3.ly|4ms.me|4sq.com|4url.cc|6url.com|7.ly|307.to|›.ws|✩.ws|✿.ws|❥.ws|➔.ws|➞.ws|➡.ws|➨.ws|➯.ws|➹.ws|➽.ws|a.gg|a.nf|aa.cx|abcurl.net|ad.vu|adf.ly|adjix.com|afx.cc|aka.ms|all.fuseurl.com|alturl.com|amzn.to|ar.gy|arst.ch|atu.ca|azc.cc|b2l.me|b23.ru|bacn.me|bcool.bz|binged.it|bit.ly|bizj.us|bloat.me|bravo.ly|bsa.ly|budurl.com|canurl.com|chilp.it|chzb.gr|cl.lk|cl.ly|clck.ru|cli.gs|cliccami.info|clickthru.ca|clipurl.us|clop.in|conta.cc|cort.as|cot.ag|crks.me|ctvr.us|cutt.us|dai.ly|db.tt|decenturl.com|dfl8.me|digbig.com|digg.com|disq.us|dld.bz|dlvr.it|do.my|doiop.com|dopen.us|dwarfurl.com|easyuri.com|easyurl.net|eepurl.com|eweri.com|fa.by|fav.me|fb.me|fbshare.me|ff.im|fff.to|fire.to|firsturl.de|firsturl.net|flic.kr|flq.us|fly2.ws|fon.gs|freak.to|fuseurl.com|fuzzy.to|fwd4.me|fwib.net|g.page|g.ro.lt|gizmo.do|gl.am|go.9nl.com|go.ign.com|go.usa.gov|goo.gl|goshrink.com|gurl.es|hex.io|hiderefer.com|hmm.ph|href.in|hsblinks.com|htxt.it|huff.to|hulu.com|hurl.me|hurl.ws|icanhaz.com|idek.net|ilix.in|is.gd|its.my|ix.lt|j.mp|jijr.com|kl.am|klck.me|korta.nu|krunchd.com|l9k.net|lat.ms|liip.to|liltext.com|lin.cr|linkbee.com|linkbun.ch|liurl.cn|ln-s.net|ln-s.ru|lnk.gd|lnk.ms|lnkd.in|lnkurl.com|loopt.us|lost.in|lru.jp|lt.tl|lurl.no|macte.ch|mash.to|mbsy.co|memurl.com|merky.de|migre.me|miniurl.com|minurl.fr|mke.me|moby.to|moourl.com|mrte.ch|myloc.me|myurl.in|n.pr|nanourl.se|nbc.co|nblo.gs|nn.nf|not.my|notlong.com|nsfw.in|nutshellurl.com|nxy.in|nyti.ms|o-x.fr|oc1.us|officeurl.com|om.ly|omf.gd|omoikane.net|on.cnn.com|on.mktw.net|onforb.es|orz.se|ow.ly|peaurl.com|ping.fm|piurl.com|pli.gs|plurl.me|pnt.me|politi.co|poprl.com|post.ly|pp.gg|profile.to|ptiturl.com|pub.vitrue.com|qlnk.net|qrli.to|qte.me|qu.tc|qy.fi|r.im|rb6.me|rde.me|read.bi|readthis.ca|reallytinyurl.com|redd.it|redir.ec|redirects.ca|redirx.com|retwt.me|ri.ms|rickroll.it|riz.gd|rt.nu|ru.ly|rubyurl.com|rurl.org|rww.tw|s4c.in|s7y.us|safe.mn|sameurl.com|sdut.us|shar.es|share.epidemicsound.com|sharepointurl.com|shink.de|shorl.com|short.ie|short.to|shortlinks.co.uk|shorturl.com|shout.to|show.my|shrinkify.com|shrinkr.com|shrt.fr|shrt.st|shrten.com|shrunkin.com|simurl.com|slate.me|smallr.com|smsh.me|smurl.name|sn.im|sn.vc|snipr.com|snipurl.com|snurl.com|sp2.ro|spedr.com|srnk.net|srs.li|starturl.com|su.pr|surl.co.uk|surl.hu|surl.link|surl.ms|t.cn|t.co|t.lh.com|ta.gd|tbd.ly|tcrn.ch|tgr.me|tgr.ph|tighturl.com|tiniuri.com|tiny.cc|tiny.ly|tiny.pl|tinylink.in|tinysong.com|tinyuri.ca|tinyurl.com|tk.|tl.gd|tmi.me|tnij.org|tnw.to|tny.com|to.|to.ly|togoto.us|totc.us|toysr.us|tpm.ly|tr.im|tra.kz|trg.li|trim.li|trunc.it|twhub.com|twirl.at|twitclicks.com|twitterurl.net|twitterurl.org|twiturl.de|twurl.cc|twurl.nl|u76.org|u.mavrev.com|u.nu|ub0.cc|ulu.lu|updating.me|ur1.ca|url4.eu|url360.me|url.az|url.co.uk|url.ie|urlborg.com|urlbrief.com|urlcover.com|urlcut.com|urlenco.de|urli.nl|urls.im|urlshorteningservicefortwitter.com|urlx.ie|urlzen.com|usat.ly|use.my|vaugette.com|vb.ly|vgn.am|vl.am|vm.lc|w34.us|w55.de|wapo.st|wapurl.co.uk|wipi.es|wp.me|www.0rz.tw|www.1link.in|www.1url.com|www.2.gp|www.2big.at|www.2tu.us|www.3.ly|www.4ms.me|www.4sq.com|www.4url.cc|www.6url.com|www.7.ly|www.307.to|www.›.ws|www.✩.ws|www.✿.ws|www.❥.ws|www.➔.ws|www.➞.ws|www.➡.ws|www.➨.ws|www.➯.ws|www.➹.ws|www.➽.ws|www.a.gg|www.a.nf|www.aa.cx|www.abcurl.net|www.ad.vu|www.adf.ly|www.adjix.com|www.afx.cc|www.aka.ms|www.all.fuseurl.com|www.alturl.com|www.amzn.to|www.ar.gy|www.arst.ch|www.atu.ca|www.azc.cc|www.b2l.me|www.b23.ru|www.bacn.me|www.bcool.bz|www.binged.it|www.bit.ly|www.bizj.us|www.bloat.me|www.bravo.ly|www.bsa.ly|www.budurl.com|www.canurl.com|www.chilp.it|www.chzb.gr|www.cl.lk|www.cl.ly|www.clck.ru|www.cli.gs|www.cliccami.info|www.clickthru.ca|www.clipurl.us|www.clop.in|www.conta.cc|www.cort.as|www.cot.ag|www.crks.me|www.ctvr.us|www.cutt.us|www.dai.ly|www.db.tt|www.decenturl.com|www.dfl8.me|www.digbig.com|www.digg.com|www.disq.us|www.dld.bz|www.dlvr.it|www.do.my|www.doiop.com|www.dopen.us|www.dwarfurl.com|www.easyuri.com|www.easyurl.net|www.eepurl.com|www.eweri.com|www.fa.by|www.fav.me|www.fb.me|www.fbshare.me|www.ff.im|www.fff.to|www.fire.to|www.firsturl.de|www.firsturl.net|www.flic.kr|www.flq.us|www.fly2.ws|www.fon.gs|www.freak.to|www.fuseurl.com|www.fuzzy.to|www.fwd4.me|www.fwib.net|www.g.page|www.g.ro.lt|www.gizmo.do|www.gl.am|www.go.9nl.com|www.go.ign.com|www.go.usa.gov|www.goo.gl|www.goshrink.com|www.gurl.es|www.hex.io|www.hiderefer.com|www.hmm.ph|www.href.in|www.hsblinks.com|www.htxt.it|www.huff.to|www.hulu.com|www.hurl.me|www.hurl.ws|www.icanhaz.com|www.idek.net|www.ilix.in|www.is.gd|www.its.my|www.ix.lt|www.j.mp|www.jijr.com|www.kl.am|www.klck.me|www.korta.nu|www.krunchd.com|www.l9k.net|www.lat.ms|www.liip.to|www.liltext.com|www.lin.cr|www.linkbee.com|www.linkbun.ch|www.liurl.cn|www.ln-s.net|www.ln-s.ru|www.lnk.gd|www.lnk.ms|www.lnkd.in|www.lnkurl.com|www.loopt.us|www.lost.in|www.lru.jp|www.lt.tl|www.lurl.no|www.macte.ch|www.mash.to|www.mbsy.co|www.memurl.com|www.merky.de|www.migre.me|www.miniurl.com|www.minurl.fr|www.mke.me|www.moby.to|www.moourl.com|www.mrte.ch|www.myloc.me|www.myurl.in|www.n.pr|www.nanourl.se|www.nbc.co|www.nblo.gs|www.nn.nf|www.not.my|www.notlong.com|www.nsfw.in|www.nutshellurl.com|www.nxy.in|www.nyti.ms|www.o-x.fr|www.oc1.us|www.officeurl.com|www.om.ly|www.omf.gd|www.omoikane.net|www.on.cnn.com|www.on.mktw.net|www.onforb.es|www.orz.se|www.ow.ly|www.peaurl.com|www.ping.fm|www.piurl.com|www.pli.gs|www.plurl.me|www.pnt.me|www.politi.co|www.poprl.com|www.post.ly|www.pp.gg|www.profile.to|www.ptiturl.com|www.pub.vitrue.com|www.qlnk.net|www.qrli.to|www.qte.me|www.qu.tc|www.qy.fi|www.r.im|www.rb6.me|www.rde.me|www.read.bi|www.readthis.ca|www.reallytinyurl.com|www.redd.it|www.redir.ec|www.redirects.ca|www.redirx.com|www.retwt.me|www.ri.ms|www.rickroll.it|www.riz.gd|www.rt.nu|www.ru.ly|www.rubyurl.com|www.rurl.org|www.rww.tw|www.s4c.in|www.s7y.us|www.safe.mn|www.sameurl.com|www.sdut.us|www.shar.es|www.share.epidemicsound.com|www.sharepointurl.com|www.shink.de|www.shorl.com|www.short.ie|www.short.to|www.shortlinks.co.uk|www.shorturl.com|www.shout.to|www.show.my|www.shrinkify.com|www.shrinkr.com|www.shrt.fr|www.shrt.st|www.shrten.com|www.shrunkin.com|www.simurl.com|www.slate.me|www.smallr.com|www.smsh.me|www.smurl.name|www.sn.im|www.sn.vc|www.snipr.com|www.snipurl.com|www.snurl.com|www.sp2.ro|www.spedr.com|www.srnk.net|www.srs.li|www.starturl.com|www.su.pr|www.surl.co.uk|www.surl.hu|www.surl.link|www.surl.ms|www.t.cn|www.t.co|www.t.lh.com|www.ta.gd|www.tbd.ly|www.tcrn.ch|www.tgr.me|www.tgr.ph|www.tighturl.com|www.tiniuri.com|www.tiny.cc|www.tiny.ly|www.tiny.pl|www.tinylink.in|www.tinysong.com|www.tinyuri.ca|www.tinyurl.com|www.tk.|www.tl.gd|www.tmi.me|www.tnij.org|www.tnw.to|www.tny.com|www.to.|www.to.ly|www.togoto.us|www.totc.us|www.toysr.us|www.tpm.ly|www.tr.im|www.tra.kz|www.trg.li|www.trim.li|www.trunc.it|www.twhub.com|www.twirl.at|www.twitclicks.com|www.twitterurl.net|www.twitterurl.org|www.twiturl.de|www.twurl.cc|www.twurl.nl|www.u76.org|www.u.mavrev.com|www.u.nu|www.ub0.cc|www.ulu.lu|www.updating.me|www.ur1.ca|www.url4.eu|www.url360.me|www.url.az|www.url.co.uk|www.url.ie|www.urlborg.com|www.urlbrief.com|www.urlcover.com|www.urlcut.com|www.urlenco.de|www.urli.nl|www.urls.im|www.urlshorteningservicefortwitter.com|www.urlx.ie|www.urlzen.com|www.usat.ly|www.use.my|www.vaugette.com|www.vb.ly|www.vgn.am|www.vl.am|www.vm.lc|www.w34.us|www.w55.de|www.wapo.st|www.wapurl.co.uk|www.wipi.es|www.wp.me|www.x.vu|www.xr.com|www.xrl.in|www.xrl.us|www.xurl.es|www.xurl.jp|www.y.ahoo.it|www.yatuc.com|www.ye.pe|www.yep.it|www.yfrog.com|www.yhoo.it|www.yiyd.com|www.youtu.be|www.yuarel.com|www.z0p.de|www.zi.ma|www.zi.mu|www.zipmyurl.com|www.zud.me|www.zurl.ws|www.zz.gd|www.zzang.kr|x.vu|xr.com|xrl.in|xrl.us|xurl.es|xurl.jp|y.ahoo.it|yatuc.com|ye.pe|yep.it|yfrog.com|yhoo.it|yiyd.com|youtu.be|yuarel.com|z0p.de|zi.ma|zi.mu|zipmyurl.com|zud.me|zurl.ws|zz.gd|zzang.kr)$/gm
     ,index                = filenames.indexOf("_raw__hosts.txt")
     ;

  contents[index] = contents[index].replace(regex_ok_short_links, "");
  
  clock.now("  removing OK-short-links");
}());



(function(){                                                   //Sorting and unique content
  clock.start("  file unique and sort");

  var REGEX_CARRIAGE_RETURN              = /\r/g
     ,REGEX_START_WITH_EXCLAMATION_MARK  = /^\s*\!/
     ,REGEX_EMPTY_LINE                   = /^\s*$/
     ,REGEX_NO_HASH                      = /^[^#]*$/
     ,REGEX_NO_COMMA                     = /^[^,]*$/
     ;

  function natural_compare(a, b){
    var ax=[], bx=[], an, bn, nn;
    if("function" === typeof natural_compare.extraction_rule){  //sometimes comparing the whole line isn't useful.
      a = natural_compare.extraction_rule(a);
      b = natural_compare.extraction_rule(b);
    }
    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""]) });
    while(ax.length > 0 && bx.length > 0){
      an = ax.shift();
      bn = bx.shift();
      nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if(null !== nn && 0 !== nn) return nn;
    }
    return ax.length - bx.length;
  }

  function unique(array){
    var tmp = {}, DONT_CARE = 0;
    array.forEach(function(item){ tmp[item] = DONT_CARE; });
    tmp = Object.keys(tmp);
    return tmp;
  }

  Array.prototype.unique = function(){ return unique(this); }; //better and faster implementation.

  for(var index=0; index<contents.length; index++){
    contents[index] = contents[index].split("\n").map(function(line){
                                                        if(null !== line.match(REGEX_START_WITH_EXCLAMATION_MARK))   return line;
                                                        if(null !== line.match(REGEX_EMPTY_LINE))                    return undefined; //the filter call (ahead..) will remove all those array-cells with `undefined` content, effectively removing all empty lines :]
                                                        if(null !== line.match(REGEX_NO_HASH))                       return line;
                                                        if(null !== line.match(REGEX_NO_COMMA))                      return line;

                                                        var head;
                                                        line = line.split("##");                                   //domain##rules with optional '##' maybe in DOM-attribute values..
                                                        head = line.shift();                                       //take just first-find.
                                                        line = line.join("##");                                    //in-case '##' is used in another manner somewhere-else.

                                                        //handle the "domains part"
                                                        head = head.split(",").map(function(phrase){return phrase.trim();})
                                                        head = head.unique().sort(natural_compare);                //unique and sort
                                                        head = head.join(",");

                                                        //handle the "rules part"
                                                        line = line.split(",").map(function(phrase){return phrase.trim();});
                                                        line = line.unique().sort(natural_compare);                //unique and sort
                                                        line = line.join(", ");

                                                        return head + "##" + line;                                 //reassemble line.
                                                      })
                                                      .filter(function(line){ return "string" === typeof line; })   //skip undefineds
                                                      .unique()
                                                      .sort()    //not natural sort to make sure lines starting with "!" at at first..
                                                      ;
    contents[index] = contents[index].join("\n");
  }

  clock.now("  file unique and sort");
}());



/*
//note: better use that for DEBUG purposes only, it takes about 5 minutes to work, and subdomains with '_' in them are sorted above anyway.
(function(){    //re-sort all files - group by domain.
  clock.start("  re-sort all files - group by domain.");

  function natural_compare(a, b){
    var ax=[], bx=[], an, bn, nn;
    if("function" === typeof natural_compare.extraction_rule){  //sometimes comparing the whole line isn't useful.
      a = natural_compare.extraction_rule(a);
      b = natural_compare.extraction_rule(b);
    }
    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""]) });
    while(ax.length > 0 && bx.length > 0){
      an = ax.shift();
      bn = bx.shift();
      nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if(null !== nn && 0 !== nn) return nn;
    }
    return ax.length - bx.length;
  }

  natural_compare.extraction_rule = function(a){//for comparing-only.
                                      return a.split("##").shift()            //extract domain-part (in style-rules. in no '##' lines (HOSTS) - returns whole line).
                                              .split("$").shift()             //extract domain-part (in block-rules. in no '$', returns whole line).
                                              .replace(/^(.+)[^a-z0-9\-\.]+.*$/i, "$1")  //try to extract valid domain-line strings from non-domain-like lines.
                                              .split(".").reverse().join(".") //re-order "icompile.eladkarako.com" to "com.eladkarako.com" so sorting will group by super-domain,domain,sub-domain.
                                              ;
                                    };

  for(var index=0; index<contents.length; index++){
    contents[index] = contents[index].split("\n")
                                     .sort(natural_compare)
                                     .join("\n")
                                     ;
  }

  natural_compare.extraction_rule = undefined;

  clock.now("  re-sort all files - group by domain.");
}());
*/


/*
//note: better use that for DEBUG purposes only and later remove all-spaces from '_raw__hosts.txt' manually to be sure it is not corrupted.
(function(){    //left-pad "_raw__hosts.txt"
  clock.start("  left-pad \"_raw__hosts.txt\"");

  const str_repeat  = function(s, length){return (new Array(length + 1)).join(s);}
       ,index       = filenames.indexOf("_raw__hosts.txt")
       ;
       
  contents[index] = contents[index].split("\n");
  
  //const MAX_LENGTH  = contents[index].reduce(function(carry,current){carry=Math.max(carry, current.length);return carry;},0);
  const MAX_LENGTH  = 51; //since all domains with length of 50+ characters are deleted (see "file unique and sort" step above-above), 51-spaces is a safe value to use, avoiding long'ish calculation of longest-line.

  contents[index] = contents[index].map(function(line){
                                          var length = MAX_LENGTH - line.length
                                             ,spacer = str_repeat(" ", length)
                                             ;
                                          return spacer + line;
                                   });

  contents[index] = contents[index].join("\n");

  clock.now("  left-pad \"_raw__hosts.txt\"");
}());
*/


/*********************************** W R I T E   F I L E S ****************************/



(function(){    //rewrite original files with fixe/sorted/uniqueified content, still working with the content variable (RAM) though.
  clock.start("  rewrite original-files + restore original timestamp");

  files.forEach(function(file, index){
    fs.writeFileSync(file, contents[index].replace(/\r/gm,"").replace(/\n/gm,"\r\n"), {flag:"w", encoding:"utf8"}); //overwrite
    fs.utimesSync(file, dates[index].atime, dates[index].mtime);  //restore timestamp for modified content.
  });

  clock.now("  rewrite original-files + restore original timestamp");
}());



//writing files into the ./build/ folder



  (function(index){                                              //write hosts.txt/hosts0.txt to build folder
  clock.start("  write hosts.txt/hosts0.txt to build folder");

  index = filenames.indexOf("_raw__hosts.txt");

  var HOSTS127                 = path.resolve("." + path.sep + "build" + path.sep + "hosts.txt")
     ,HOSTS0                   = path.resolve("." + path.sep + "build" + path.sep + "hosts0.txt")
     ,HOSTS127_WITH_LOCALHOST  = path.resolve("." + path.sep + "build" + path.sep + "hosts_with_localhost.txt")   //having those 3 lines to make sure the HOSTS will proper redirect internal connections.
     ,HOSTS0_WITH_LOCALHOST    = path.resolve("." + path.sep + "build" + path.sep + "hosts0_with_localhost.txt")
     ,TITLE_LOCALHOST          = "127.0.0.1 localhost"      + "\n"
                               + "127.0.0.1 loopback"       + "\n"
                               + "::1       localhost"      + "\n"
                               + "::1       ip6-localhost"  + "\n"
     ;

  var title = "#last updated at ##MTIME##+00:00 UTC . contains ##LINES## bad-hosts. direct link: https://raw.githubusercontent.com/eladkarako/hosts/master/build/##FILE## ."
                .replace(/##MTIME##/,dates[index].mtime_iso)
                .replace(/##LINES##/,contents[index].split("\n").length)
      ,tmp_content
      ;

  /*
  tmp_content = title.replace(/##FILE##/,"hosts.txt") + "\n" + contents[index].replace(/^/mg, "127.0.0.1 ");
  tmp_content = tmp_content.replace(/\r/gm,"").replace(/\n/gm,"\r\n"); //explicitly use Windows EOL (CR+LF)
  fs.writeFileSync(HOSTS127, tmp_content, {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.utimesSync(HOSTS127, dates[index].atime, dates[index].mtime);  //timestamp
  
  tmp_content = title.replace(/##FILE##/,"hosts_with_localhost.txt") + "\n" + TITLE_LOCALHOST + "\n" + contents[index].replace(/^/mg, "127.0.0.1 ");
  tmp_content = tmp_content.replace(/\r/gm,"").replace(/\n/gm,"\r\n"); //explicitly use Windows EOL (CR+LF)
  fs.writeFileSync(HOSTS127_WITH_LOCALHOST, tmp_content, {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.utimesSync(HOSTS127_WITH_LOCALHOST, dates[index].atime, dates[index].mtime);  //timestamp
  */
  
  tmp_content = title.replace(/##FILE##/,"hosts0.txt") + "\n" + contents[index].replace(/^/mg, "0.0.0.0 ");
  tmp_content = tmp_content.replace(/\r/gm,"").replace(/\n/gm,"\r\n"); //explicitly use Windows EOL (CR+LF)
  fs.writeFileSync(HOSTS0, tmp_content, {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.utimesSync(HOSTS0, dates[index].atime, dates[index].mtime);  //timestamp
  
  tmp_content = title.replace(/##FILE##/,"hosts0_with_localhost.txt") + "\n" + TITLE_LOCALHOST + "\n" + contents[index].replace(/^/mg, "0.0.0.0 ");
  tmp_content = tmp_content.replace(/\r/gm,"").replace(/\n/gm,"\r\n"); //explicitly use Windows EOL (CR+LF)
  fs.writeFileSync(HOSTS0_WITH_LOCALHOST, tmp_content, {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.utimesSync(HOSTS0_WITH_LOCALHOST, dates[index].atime, dates[index].mtime);  //timestamp

  
  tmp_content = ""; //cleanup

  clock.now("  write hosts.txt/hosts0.txt to build folder");
}());



(function(){                                                  //write adblock lists to build folder
  clock.start("  write adblock lists to build folder");

  const TITLE                  = "[Adblock Plus 2.0]"                   + "\n" +
                                 "! Checksum:       XXXX"               + "\n" +
                                 "! Expires:        14 days"            + "\n" +
                                 "! Last modified:  ##LAST_MODIFIED##"  + "\n" +
                                 "! Version:        ##VERSION##"        + "\n" +
                                 "! Title:          ##TITLE##"                                    + "\n" +
                                 "! Rules:          ##NUMBER_OF_RULES##"                          + "\n" +
                                 "! Homepage:       http://hosts.eladkarako.com/"                 + "\n" +
                                 "! Author:         http://hosts.eladkarako.com/humans.txt"       + "\n" +
                                 "! Forums:         https://github.com/eladkarako/hosts/issues/"  + "\n" +
                                 "! Download:       ##DOWNLOAD##"                                 + "\n" +
                                 "! --------------------------------------------------------------------------------------"  + "\n"
     ,filenames_target         = ["hosts_adblock.txt"                                   //first in-line, is the content of '_raw__hosts.txt'.
                                 ,"hosts_adblock_anti_annoyances_hide.txt"
                                 ,"hosts_adblock_anti_annoyances_block.txt"
                                 ,"hosts_adblock_anti_annoyances_block_inline_script.txt"
                                 ,"hosts_adblock_anti_annoyances_style_inject.txt"
                                 ]
     ,files_target             = filenames_target.map(function(filename_target){ return path.resolve("./build/" + filename_target);  })
     ,titles                   = ["HOSTS AdBlock - Protect Your SmartPhone"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Hide Annoying Elements"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Block Annoying Connections"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Block Annoying Page-Scripts"
                                 ,"HOSTS AdBlock - Anti-Annoyance - ReStyle Annoying Pages"
                                 ]
     ,REGEX_LINES_IGNORED      = /^\s*\!/mg
     ,REGEX_LINES_TOTAL        = /$/mg
     ,REGEX_LINE_START         = /^/mg
     ,crypto                   = require("crypto")
     ;

  contents.forEach(function(content, index){
    if(0===index) content = content.replace(/^/gm,"||")             //hosts_adblock.txt requires small modification.
                                   .replace(/$/gm,"^")              //hosts_adblock.txt requires small modification.
                                 /*.replace(/$/gm,"$important")*/   //optional - make rule "stronger".
                                   ;

    content = TITLE.replace(/##LAST_MODIFIED##/    , dates[index].mtime_iso + "+00:00 UTC")
                   .replace(/##VERSION##/          , dates[index].mtime_iso.replace(/[^\d]/g,""))
                   .replace(/##TITLE##/            , titles[index])
                   .replace(/##NUMBER_OF_RULES##/  , (content.match(REGEX_LINES_TOTAL) || []).length - (content.match(REGEX_LINES_IGNORED) || []).length)
                   .replace(/##DOWNLOAD##/         , "https://raw.githubusercontent.com/eladkarako/hosts/master/build/" + filenames_target[index])
              + content;

    //checksum
    content = content.replace(/\! Checksum\:\s*XXXX\n/mg, "");                //dummy-checksum-line. remove it.
    /* //checksum miss-calculated?
    content = content.replace(/\n/m                                           //add real-checksum line after first \n (really just a fancy way to say "second line")
                              ,"\n! Checksum:       "
                               + crypto.createHash("md5").update(content).digest("hex")
                               + "\n");
    */
    content = content.replace(/\r/gm,"").replace(/\n/gm,"\r\n"); //explicitly use Windows EOL (CR+LF)
    fs.writeFileSync(files_target[index], content, {flag:"w", encoding:"utf8"});  //overwrite if exist
    fs.utimesSync(files_target[index], dates[index].atime, dates[index].mtime);  //timestamp
  });

  clock.now("  write adblock lists to build folder");
}());



clock.now("~~");

