<h1><img alt="" width="48" height="48" src="resources/icon.png"/>HOSTS/Ad-Block</h1>

<img alt="" src="resources/icon.gif"/>


<h3><em>Warning</em>: This is NOT your standard blocking-list!</h3>


```diff
-! That HOSTS-file is huge! (~60MB)
# Android-apps (AdGuard, Blokada) will only partially load it.
# Try using it as an OS HOSTS-file (Android - root!, Windows - pre-disable 'DNS Client' service!).

-! Blocks: 
-! Some social-networks (Facebook, Twitter, Instagram, Pintrest, ...). 
-! Some 3'rd-party comment-services (Disqus, Spot.im, ...). 
-! An extended (!) list of stuff other lists blocks as well (ads, analytics, telemetrics, fishing, malwares).
-! Google firebase and crashlytics. Might break some mobile apps! but it stops any app being able to dynamicly configure itself based on remote location (they have their default already), plus analytics/telemetrics and huge amount of connections open. saves your privacy, data plan and battery.
-! Annoying stuff or websites. Just my personal opinion.

# If you are using this list and find-out your favorite website is blocked - open an issue.

+~ Google (except for the ads-domains) and WhatsApp (although it's Facebook's) are cool . 

# Using those lists will greatly privacy and speed-up browsing on any operation-system.
# I suggest you also set-up 'AdGuard-DNS' as your DNS. Works best in your home-router!
```

<hr/>

<h3>Note: There are no "special"/extended/Unicode characters in the lists, just plain ASCII. I've made sure of it. I do however writes the files as UTF-8 (no signature, no BOM) which is effectivly supports extended characters (but again will never be used).</h3>
<h3>Note: I no longer distribute HOSTS with the 127.0.0.1 prefix. Use 'hosts0.txt' or 'hosts0_with_localhost.txt' links instead. Connections set to <code>0.0.0.0</code> are efficiently closed (and on newer browsers - never opened!) which is far more efficient than <code>127.0.0.1</code> which expects localhost-server response and times out after some time..</h3>
<h3>Note: I now use explicitly Windows EOL (CR+LF a.k.a \r\n), in all of the files. it should not matter to linux OS too much other than what seems to be and extra line on some old editors, but Windows users should be able to copy/paste it faster to their hosts (no implicit EOL convertion). I do wonder how it will work on my Android devices, shouldn't be a problem.. If it bugs you open an issue and I might re-cosider..</h3>
<h2>Windows Users! YOU MUST PRE-STOP AND DISABLE YOUR 'DNS Client' SERVICE! unless you want to wait 10 minutes with CPU at 100% after everytime you update your HOSTS file.</h2>

<hr/>

<ul>
<li>
<h3>Direct-URL to the lists:</h3> 
Use it anyway you like (link-to, download, copy, distribute,...)
<pre>
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/_raw__hosts.txt
<hr/>
<del>https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts.txt</del>
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts0.txt
<hr/>
<del>https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_with_localhost.txt</del>
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts0_with_localhost.txt
<hr/>
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock.txt

https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_hide.txt
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_block.txt
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_block_inline_script.txt
https&#x003A;//raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_style_inject.txt
</pre>

You can either use <code>eladkarako</code> as the <code>USERNAME</code> (links/folder-structure might be change some day), 
or <strong>fork the repository and use your own github-username</strong>.
<hr/>
</li>
<li>
<h3>What are all of those links?</h3>

The <code>_raw__hosts.txt</code> file is just a raw list of the host-domains (without any prefix),
<del><code>hosts.txt</code> uses <code>127.0.0.1 </code> prefix for each line</del>,
<code>hosts0.txt</code> uses <code>0.0.0.0 </code> prefix for each line,

<del><code>hosts_with_localhost.txt</code></del> and <code>hosts0_with_localhost.txt</code> uses the same prefixes but adds an additional entries for machine's self-<code>localhost</code>.

The <code>hosts_adblock.txt</code> has the same content as <code>_raw__hosts.txt</code> built with an additional <a href="https://github.com/gorhill/uBlock/wiki/Static-filter-syntax/">uBlock-filter format</a> file-headers.
<hr/>
</li>
<li>
You may download the whole repository in a zip file (about 200MB though!):
<a href="https://github.com/USERNAME/hosts/archive/master.zip">https://github.com/USERNAME/hosts/archive/master.zip</a>. 
Aria2C or similar parallel-download-manager is advised!
<hr/>
</li>
<li>
<h3>Custom lists:</h3>
Once you've fetched the repository (by either simply download it or by fork-and-clone), 
you may edit it and generate new build. 

It is very easy to generate a new "build", 

There are <strong>no dependencies</strong>!

Only thing needed is <strong>any version of NodeJS</strong> on your machine.

For example, you can get a single exe for Windows in <a href="https://nodejs.org/download/nightly">https://nodejs.org/download/nightly</a>. Just choose a version and browse <code>win-x86/</code> folder, downloading <code>node.exe</code>.

To generate a new "build", delete the build folder, 
and run your NodeJS with <code>_builder.js</code>. You may use <code>_builder.cmd</code> on Windows. 
<hr/>
</li>
</ul>

<hr/>

I'm not being pa!d for it or anything, 
but if you want to protect yourself from ads and other malicious domains, 
I strongly advise you'll change your home (or work) router's DNS to AdGuard's DNS. 
It is free, and it will block ads in a similar way to the way the HOSTS file works, 
by returning <code>0.0.0.0</code> to several (although not as much as mine) domains, 
instead of actual-resolving into IP. You can still use HOSTS and AdBlocking-browser-extensions, 
this is just another way you can help all the clients (smartphones, smart-TVs, computers,...) 
of your home WiFi, without the needs to root Android devices, or install anything. 
The DNS addresses you should change into are: <strong><code>176.103.130.130</code></strong> and <strong><code>176.103.130.131</code></strong>. Google AdGuard-DNS for more information.

<hr/>

<br/>

<a href="https://paypal.me/e1adkarak0" ok><img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal Donation" ok></a>

