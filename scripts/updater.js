// updater.js

var domSection = document.querySelector('main > section'),
    domHeader = document.querySelector('body > header'),
    domNav = document.createElement('nav'),
    domMonitor = domAppend({ tag: 'div', attributes: { open: '' }, class: 'details' }),
    domUl = domAppend({ tag: 'ul' }),
    domUlRepo = domAppend({ tag: 'ul' }),
    domUlParent = domAppend({ tag: 'ul' }),
    domUlGame = domAppend({ tag: 'ul' }),
    domLiRepo = domAppend({ tag: 'li', innerHTML: 'This repository' }),
    domLiParent = domAppend({ tag: 'li', innerHTML: 'Parent repository' }),
    domLiGame = domAppend({ tag: 'li', innerHTML: 'Game' }),
    domSummary = domAppend({ tag: 'p', innerHTML: 'Monitor', class: 'summary' }),
    domEditor = document.createElement('div'),
    domCancel = domAppend({ tag: 'button', innerHTML: 'Cancel' }),
    domSubmit = domAppend({ tag: 'button', innerHTML: 'Save file' }),
    domValid = document.createElement('span'),
    domTable = domAppend({ tag: 'table', class: 'leagues' }),
    domXrate = document.querySelector('footer > small'),
    repoContent = {},
    repoType = '',
    repoPulls = {},
    userType = '',
    mergeArray = [],
    pullsArray = [],
    jsonSetup = {},
    shaSetup,
    jsonLeagues = {},
    shaLeagues,
    jsonTeam = {},
    shaTeam,
    applyResponse;

// functions
Element.prototype.appendChilds = function (elementArray) {
  for (var i = 0; i < elementArray.length; i++) {
    if (elementArray[i]) this.appendChild(elementArray[i]);
  }
  return true;
};

// Details Handlers
function detailsInit() {
  var details = document.querySelectorAll('.details');
  for (var i = 0; i < details.length; i++) {
    var detail = details[i];
    var summary = detail.querySelector('.summary');
    summary.addEventListener('click', detailsCallback );
  }
}

function detailsCallback(e) {
  e.preventDefault();
  var target = e.target.parentNode;
  if (target.hasAttribute('close')) { target.removeAttribute('close'); target.setAttribute('open', ''); } else if (target.hasAttribute('open')) { target.removeAttribute('open'); target.setAttribute('close', ''); } else target.setAttribute('open', '');
}

// Dom alert
function domAlert(content) {
  domAppend({ tag: 'p', parent: domSection, innerHTML: content, attributes: {'role': 'alert'} });
}

// Setup Editor form and buttons
function setupEditor() {
  domSection.appendChilds([domEditor, domCancel, domSubmit, domValid]);
}

function hideEditor() {
  var divs = document.querySelector('div[data-schemaid]');
  divs.setAttribute('hidden','');
  domCancel.setAttribute('hidden','');
  domValid.setAttribute('hidden','');
  domSubmit.setAttribute('hidden','');
}

// functions
function urlScript() {
  var url = 'home';
  if (urlSlash[2] && urlSlash[2]!=='index.html') {
    url = urlSlash[2];
    if (urlSlash[3]) {
      url += '-' + urlSlash[3];
    }
  }
  return url;
}

// Expiration branch update
function expire(utc) {
  var diff = Date.now() - utc;
  var mins = Math.floor(diff / 60000);
  return (mins > 1) ? true : false;
}

function setupMenu() {
  if (domHeader.querySelector('nav')) return false;
  domHeader.appendChild(domNav);
  var leagues = domAppend({ tag: 'a', innerHTML: 'LEAGUES', attributes: { href: repoHome } }),
      teams = domAppend({ tag: 'a', innerHTML: 'TEAMS', attributes: { href: repoHome + '/teams' } }),
      rounds = domAppend({ tag: 'a', innerHTML: 'ROUNDS', attributes: { href: repoHome + '/rounds' } }),
      login = domAppend({ tag: 'a', innerHTML: 'Login', attributes: { href: repoHome + '/login' } }),
      team, setup, leagueSetup, teamSetup;
  if (repoType == 'User') {
    team = domAppend({ tag: 'a', innerHTML: 'TEAM', attributes: { href: repoHome + '/team' } });
    if (userType == 'owner') {
      teamSetup = domAppend({ tag: 'a', innerHTML: 'TEAM SETUP', attributes: { href: repoHome + '/team/setup' } });
    }
  }
  if (repoType == 'Organization') {
    setup = domAppend({ tag: 'a', innerHTML: 'SETUP', attributes: { href: repoHome + '/setup' } });
    if (userType == 'owner') {
      leagueSetup = domAppend({ tag: 'a', innerHTML: 'LEAGUE SETUP', attributes: { href: repoHome + '/league/setup' } });
    }
  }
  if (userLogged) login = domAppend({ tag: 'a', innerHTML: 'Logout', attributes: { href: repoHome + '/logout' } });
  domNav.appendChilds([leagues, setup, leagueSetup, team, teamSetup, teams, rounds, login]);
}

function loadPagescript() {
  domAppend({ tag: 'script', parent: 'body', attributes: { src: rawgitUrl('master') + '/scripts/' + urlScript() + '.js', type: 'text/javascript' } });
}

function showReadme() {
  apiCall({
    url: repoAPI + '/readme?ref=gh-pages',
    accept: 'application/vnd.github.v3.html',
    cb: function() {
      domAppend({tag: 'div', parent: domSection, innerHTML: this});
    }
  });
}

function showLeagues(leagueArray) {
  for( i=0; i < leagueArray.length; i++ ) {
    var league = leagueArray[i];
    var row = document.createElement('tr');
    row.innerHTML = '<td><a href="' + repoHome + '/league/#league=' + league.slug + '">' + league.title + '</a></td>';
    row.innerHTML += '<td>' + league.running.toString() + '</td>';
    if (league.accept && !league.running && repoType == 'User' && userType == 'owner') {
      row.innerHTML += '<td><a href="." onclick="applyLeague(event, \'' + league.slug + '\');">Apply</a></td>';
    } else {
      row.innerHTML += '<td></td>';
    }
    domTable.appendChild(row);
  }
  domSection.appendChild(domTable);
  return true;
}

function goGuest() {
  setupMenu();
  domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'guest: <a href="' + repoHome + '/login/">login</a>' });
  loadSetup();
}

function apiCall(obj) {
  if (!obj.hasOwnProperty('cb')) obj.cb = function() { console.log(this); };
  if (!obj.hasOwnProperty('url')) obj.url = repoAPI;
  if (!obj.hasOwnProperty('method')) obj.method = 'GET';
  if (!obj.hasOwnProperty('accept')) obj.accept = 'application/vnd.github.v3.full+json';
  if (!obj.hasOwnProperty('data')) obj.data = null;
  if (!obj.hasOwnProperty('err')) obj.err = false;
  obj.etag = 'etag.' + obj.url.replace(/\W+/g, "");
  var xhr = new XMLHttpRequest();
  xhr.open ( obj.method, obj.url, true );
  xhr.setRequestHeader( 'Accept', obj.accept );
  if (userToken && atob(userToken)) {
    xhr.setRequestHeader( 'Authorization', 'token ' + atob(userToken) );
    userLogged = true;
  }
  if (localStorage.getItem(obj.etag)) xhr.setRequestHeader('If-None-Match', localStorage.getItem(obj.etag));
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      document.body.classList.remove('request');
      if (xhr.getResponseHeader('ETag') && obj.url.indexOf('ref=') == -1 ) {
        var etag = RegExp(/W\/"(.*?)"/).exec(xhr.getResponseHeader('ETag'));
        if (etag) localStorage.setItem(obj.etag, etag[1]);
      }
      if (xhr.status == 200 ||  xhr.status == 201 ||  xhr.status == 204) {
        if (typeof obj.cb == 'function') {
          if (xhr.getResponseHeader('X-RateLimit-Remaining') < 5) domAlert('rate limit: ' + xhr.getResponseHeader('X-RateLimit-Remaining'));
          if (xhr.getResponseHeader('X-RateLimit-Remaining') < 2) window.location = repoHome + '/login/';
          domXrate.innerHTML = 'X-RateLimit-Remaining: ' + xhr.getResponseHeader( 'X-RateLimit-Remaining' );
          var response = (obj.accept.indexOf('html') > -1) ? xhr.responseText : JSON.parse(xhr.responseText);
          obj.cb.apply(response);
        }
      }
      if (xhr.status == 401) {
        userLogged = false;
        domAlert('bad credential: <a href="' + repoHome + '/login/">login</a>');
      }
      if (xhr.status >= 400) {
        if (typeof obj.err == 'function') {
          obj.err.apply( xhr );
        } else {
          domAlert('api error: ' + obj.url);
          console.log( xhr );
        }
      }
    }
  };
  document.body.classList.add('request');
  xhr.send( obj.data );
}

function repoGet() {
  apiCall({
    cb: function() {
      repoContent = this;
      domAppend({ tag: 'li', parent: domUlRepo, innerHTML: 'repository: <a href="https://github.com/' + this.full_name + '">' + this.full_name + '</a> ' });
      domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>master</em> ref: ' + sessionStorage.getItem('masterRef').slice(0,7) });
      repoType = this.owner.type;
      // ORGANIZATION
      if ( this.owner.type == 'Organization' ) {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'game started: ' + this.created_at });
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'players: ' + this.forks });
        if (this.permissions && this.permissions.admin === true) {
          userType = 'owner';
          pullRequests();
          setupMenu();
        } else {
          userType = 'guest';
          goGuest();
        }
      }
      // PLAYER
      if ( this.owner.type == 'User' ) {
        if (this.fork) {
          domAppend({tag: 'li', parent: domUlGame, innerHTML: 'game started: ' + this.parent.created_at });
          domAppend({tag: 'li', parent: domUlGame, innerHTML: 'players: ' + this.parent.forks });
          domAppend({tag: 'li', parent: domUlGame, innerHTML: 'joined: ' + this.created_at });
          if (this.permissions && this.permissions.admin === true) {
            userType = 'owner';
            setupMenu();
            pullsMade();
          } else {
            userType = 'guest';
            goGuest();
          }
        } else {
          domAlert('error: user repo is not a fork');
        }
      }
    }
  });
}

function pullsMade() {
  apiCall({
    url: "https://api.github.com/repos/" + repoContent.parent.full_name + '/pulls',
    data: '{"base":"teams"}',
    cb: function () {
      pullsArray = this;
      if (pullsArray.length) {
        domAppend({tag: 'li', parent: domUlRepo, innerHTML: pullsArray.length + ' pull request waiting'});
        checkDataParent();
      } else checkTeamsParent();
    }
  });
}

function checkTeamsParent() {
  apiCall({
    url: "https://api.github.com/repos/" + repoContent.parent.full_name + "/git/refs/heads/teams",
    cb: function() {
      sessionStorage.setItem('teamsParentRef', this.object.sha);
      domAppend({tag: 'li', parent: domUlParent, innerHTML: '<em>teams</em> ref: ' + this.object.sha.slice(0,7)});
      checkTeams();
    }
  });
}

function checkTeams() {
  apiCall({
    url: repoAPI + "/git/refs/heads/teams",
    cb: function() {
      sessionStorage.setItem('teamsRef', this.object.sha);
      if (this.object.sha == sessionStorage.teamsParentRef) {
        domAppend({tag: 'li', parent: domUlRepo, innerHTML: '<em>teams</em> ref: ' + sessionStorage.teamsRef.slice(0,7)});
        checkDataParent();
      } else {
        domAppend({tag: 'li', parent: domUlRepo, innerHTML: '<em>teams</em> ref: starting update from ' + sessionStorage.teamsParentRef.slice(0,7)});
        update('teams', sessionStorage.teamsParentRef);
      }
    }
  });
}

function pullRequests() {
  apiCall({
    url: repoAPI + "/pulls",
    data: '{"base":"teams"}',
    cb: function() {
      repoPulls = this;
      if (repoPulls.length !== 0) {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'pending pulls: <a href="' + repoContent.html_url + '/pulls">' + repoPulls.length + ' pulls</a>' });
        mergePulls();
      }else{
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'no pending pulls' });
        checkData();
      }
    }
  });
}

function mergePulls() {
  for (var i = 0; i < repoPulls.length; i++) {
    apiCall({
      url: repoAPI + '/pulls/' + repoPulls[i].number + '/merge',
      method: 'PUT',
      accept: 'application/vnd.github.polaris-preview',
      data: '{"squash": true,"commit_title": "Merge #' + i + '"}',
      cb: mergeCallback,
      err: domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'merged: error on Merge #' + i })
    });
  }
  headMasterParent();
}

function mergeCallback(result) {
  mergeArray.push(result);
  sessionStorage.setItem('dataRef', result.merge.sha);
  domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'merged: ' + result.merged + ' <a href="." onclick="window.location.reload()">proceed</a>' });
}

function checkDataParent() {
  apiCall({
    url: "https://api.github.com/repos/" + repoContent.parent.full_name + "/git/refs/heads/data",
    cb: function() {
      sessionStorage.setItem('dataParentRef', this.object.sha);
      domAppend({ tag: 'li', parent: domUlParent, innerHTML: '<em>data</em> ref: ' + this.object.sha.slice(0,7) });
      checkData();
    }
  });
}

function checkData() {
  apiCall({
    url: repoAPI + "/git/refs/heads/data",
    cb: function() {
      sessionStorage.setItem('dataRef', this.object.sha);
      if (this.object.sha == sessionStorage.dataParentRef || repoType == "Organization") {
        domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>data</em> ref: ' + sessionStorage.dataRef.slice(0,7) });
        headMasterParent();
      } else {
        domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>data</em> ref: starting update from ' + sessionStorage.dataParentRef.slice(0,7) });
        update('data', sessionStorage.dataParentRef);
      }
    }
  });
}

function headMasterParent() {
  if (repoContent.fork) {
    apiCall({
      url: "https://api.github.com/repos/" + repoContent.parent.full_name + "/git/refs/heads/master",
      cb: function() {
        sessionStorage.setItem('masterParentRef', this.object.sha);
        domAppend({ tag: 'li', parent: domUlParent, innerHTML: 'repository: <a href="http://' + repoContent.parent.owner.login + '.github.io/' + repoContent.parent.name + '">' + repoContent.parent.full_name + '</a>' });
        domAppend({ tag: 'li', parent: domUlParent, innerHTML: '<em>master</em> ref: ' + sessionStorage.masterParentRef.slice(0,7) });
        if (sessionStorage.masterRef == sessionStorage.masterParentRef || !expire(sessionStorage.masterUpdated)) {
          loadSetup();
        }else{
          domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>master</em> ref: starting update from ' + sessionStorage.masterParentRef.slice(0,7) });
          update('master', sessionStorage.masterParentRef);
        }
      }
    });
  }else{
    loadSetup();
  }
}

function loadTeam() {
  apiCall({
    url: fileUrl('teams', 'teams/' + repoOwner + '.json'),
    cb: function() {
      jsonTeam = JSON.parse( b64d(this.content) );
      shaTeam = this.sha;
      domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'team: <a href="' + repoHome + '/team/setup/">edit</a>' });
      loadPagescript();
    },
    err: function() {
      if (urlScript()!='team-setup') domAlert('warning: no team, <a href="' + repoHome + '/team/setup/">create</a>');
      loadPagescript();
    }
  });
}

function loadSetup() {
  apiCall({
    url: fileUrl('data', 'setup.json'),
    cb: function() {
      jsonSetup = JSON.parse( b64d(this.content) );
      shaSetup = this.sha;
      if (repoType == 'Organization' && userType == 'owner') {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'setup: <a href="' + repoHome + '/setup/">edit</a>' });
      } else {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'setup: found' });
      }
      loadLeagues();
    },
    err: function() {
      if (repoType == 'Organization' && userType == 'owner' && urlSlash[2] != 'setup') {
        domAlert('warning: no setup, <a href="' + repoHome + '/setup/">create</a>');
      } else domAlert('error: no setup');
      loadPagescript();
    }
  });
}

function loadLeagues() {
  apiCall({
    url: fileUrl('data', 'leagues.json'),
    cb: function() {
      jsonLeagues = JSON.parse( b64d(this.content) );
      shaLeagues = this.sha;
      if (repoType == 'Organization' && userType == 'owner') {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'leagues: <a href="' + repoHome + '/league/setup/">edit</a>' });
        loadPagescript();
      } else {
        domAppend({ tag: 'li', parent: domUlGame, innerHTML: 'leagues: found' });
        if (repoType == 'User' && userType == 'owner') loadTeam(); else loadPagescript();
      }
    },
    err: function() {
      if (repoType == 'Organization' && userType == 'owner' && urlScript()!='league-setup') {
        domAlert('warning: no leagues, <a href="' + repoHome + '/league/setup/">create</a>');
      } else domAlert('error: no leagues');
      loadPagescript();
    }
  });
}

function update(branch, sha) {
  apiCall({
    url: repoAPI + "/git/refs/heads/" + branch,
    data: '{"sha":"' + sha + '","force":true}',
    accept: 'application/vnd.github.v3.patch',
    method: 'PATCH',
    cb: function() {
      sessionStorage.setItem(branch + 'Ref', this.object.sha);
      sessionStorage.setItem(branch + 'Updated', Date.now());
      domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>' + branch + '</em>: updated'});
      if (branch=='data') headMasterParent();
      if (branch=='master') repoGet();
    },
    err: function() {
      domAppend({ tag: 'li', parent: domUlRepo, innerHTML: '<em>' + branch + '</em> update error: ' + this.status + ' ' + this.statusText });
      if (branch=='data') headMasterParent();
      if (branch=='master') repoGet();
    }
  });
}

function fileUrl(branch, file) {
  return repoAPI + '/contents/' + file + '?ref=' + (sessionStorage.getItem(branch + 'Ref') ? sessionStorage.getItem(branch + 'Ref') : branch);
}

function b64e(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

function b64d(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  }).join(''));
}

function applyLeague(e, slug) {
  e.preventDefault();
  apiCall({
    url: 'https://api.github.com/repos/' + repoContent.parent.full_name + '/issues',
    method: 'POST',
    data: '{"title":"Apply to league ' + slug + '"}',
    cb: function () {
      applyResponse = this;
      domAlert('Application sent: <a href="' + repoHome + '">proceed</a>');
    }
  });
}

// Monitor init
function monitorInit() {
  domLiRepo.appendChild(domUlRepo);
  domLiParent.appendChild(domUlParent);
  domLiGame.appendChild(domUlGame);
  domUl.appendChilds([domLiRepo, domLiParent, domLiGame]);
  if (domMonitor.appendChilds([domSummary, domUl]) && domHeader.insertBefore(domMonitor, domHeader.childNodes[0])) {
    detailsInit();
  }
}

monitorInit();
if (userLogged) repoGet(); else goGuest();
