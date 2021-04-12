/*=================================================================+
|               Copyright (c) 2016 Oracle Corporation              |
|                  Redwood Shores, California, USA                 |
|                       All rights reserved.                       |
+==================================================================+
| FILENAME                                                         |
|   OAFSlideoutMenu.js                                             |
|                                                                  |
| HISTORY                                                          |
|   02-FEB-2016 apzambre   Re-Factored			           |
|   29-MAR-2013 anveverm   Bug#11904824, Hide 'Add to Favorites'   |
|                          from non-bookmarkable pages.            |
|   14-MAR-2013 anveverm   Bug#13500252, Navigator Search          |
|                          optimization to remove rest call when   |
|                          required results are available.         |
|   01-JUN-2009 skothe     Created.                                |
|                                                        	   |
+==================================================================*/
/* $Header: OAFSlideoutMenu.js 120.35.12020000.42 2019/04/30 06:52:00 atgops1 ship $ */

// REST request handler
// (not required) create new rest object and use it for rest call, once it has fulfiled its function delete the object
// use the same rest object, assign properties using prototype function
var ajax = null;
var charSearchTimer = null;
var searchTimer = null;
var searchedText = null;
var currentMenuName = null;

var restObject = (function() {
  function restO() {
    this.params = null;
  }
  // each inherited object should have params object and url for rest call defined
  // on initializing restURL is set as prototype to this object
  // restObject.prototype.restURL = 'get it from dom element'
  // restObject.prototype.params = {param1: , param2: }
  restO.prototype.postRequest = function() {
    if (ajax != null && ajax.readyState != ajax.DONE)
      ajax.abort();
    ajax = new XMLHttpRequest();
    sync = (arguments.length > 0)?false:true;
    ajax.open("POST", this.restURL, sync);
    ajax.setRequestHeader("content-type", "application/xml");
    var state = this.checkState;
    var that = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == ajax.DONE) {
        this.checkState(ajax);
      }
      // state.call(this);
    }.bind(this);
    var thatParam = this.params;
    var parameter = Object.keys(thatParam).reduce(function(prev,curr){
      return prev + "<param>parameter</param>".replace(/parameter/i, thatParam[curr]);
    }, "");
    var body = "<params>parameterList</params>".replace(/parameterList/i, parameter);
    ajax.send(body);
  };

  restO.prototype.checkState = function(xmlHttpObject) {
    var xmlResponseDoc = this.responseObject(xmlHttpObject);
    var error = xmlResponseDoc.getElementsByTagName("error");
    var noRecords = xmlResponseDoc.getElementsByTagName("NORECORDS");
    var exception = xmlResponseDoc.getElementsByTagName("EXCEPTION");
    if (xmlHttpObject.status != 200) {
      currentRequest.onErrorResponse(xmlResponseDoc);
    }
    else {
      if ((error != null && error.length > 0) || (exception !== null && exception.length > 0) ||
            (noRecords != null && noRecords.length > 0)) {
        currentRequest.onErrorResponse(xmlResponseDoc);
      }
      else {
        currentRequest.onSuccess(xmlResponseDoc);
      }
    }
  };

  restO.prototype.responseObject = function(xmlHttpObject) {
    var xmlDoc = xmlHttpObject.responseXML;
    if (!xmlDoc || xmlDoc.childNodes.length==0) {
      var xmlData = xmlHttpObject.responseText;
       
      if (window.ActiveXObject)
      {
        //for IE
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlData);
      }
      else if (document.implementation && document.implementation.createDocument)
      {
        //for Mozilla
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlData, "application/xml");
      }
    }
    return xmlDoc;
  };
  return restO;
})();

if (window.addEventListener) // DOM events
  window.addEventListener('resize', changeNavListSize, false);
else if (window.attachEvent) // IE5 events
  window.attachEvent('onresize', changeNavListSize);
  
  function changeNavListSize(){
    adjustNavigatorPopupSize('navListContainer0');
}

// code for each responsibility and function entry in popup

// create elements with its properties non-writable, non-configuarble,
// enumerable and with correct value at runtime
var elementEntry = (function() {
  function element () {
    this.childList = null;
    this.isError = false;
    this.dom = null;
  }

// add prototype function to object
element.prototype.onclick = function(event) {
  currentRequest.obj = this;
  if (this.redirect) {
    var index = getContainerIndex(event) + 1;
    closeContainer('navContainer'+index, index);
    if (this.newWin == 'Y')
      window.open(this['funcURL'], "_blank");
    else
      window.open(this['funcURL'], "_self");
  }
  else {
    if (currentRequest.initRequest(window.event || event))
    {
      var newRest = Object.create(restObject.prototype);
      newRest.params = {
        param1: this.respId,
        param2: this.respAppId,
        param3: this.menuId,
        param4: this.secGrpId,
        param5: "SLIDEOUT",
        param6: this.macKey
      };
      currentMenuName = this.respName;
      newRest.postRequest();
    }
    (this.dom).className = 'listEntrySelect';
  }
  elemStopPropogation((event || window.event));
};
element.prototype.getDOM = function() {
  //we donot support forms on iPad so removing forms from list.
  if((this['funcType'] == 'FORM') && (navigator.userAgent.indexOf("iPad") >=0) )
    return null;

  var domElem = document.createElement('div');
  if (this.hasOwnProperty('funcType') && this['funcType'] != undefined && this['funcType'] != '') {
    if (this['funcType'] == 'FORM') {
      var elemStr = '<a class="entryLink" tabindex="-1" href="#" title="'+
      this['funcName']+'" ';
      if(_agent.isChrome)
        elemStr += ' style="display:inline-block;width:100%;position:relative;top:calc(100% - 32px);"'
      elemStr +='><div class="entryImage" ';
      if(_agent.isChrome)
        elemStr += ' style="padding:5px 0px;"';
      elemStr += '><img class="image" alt="'+this['funcName']+'" src="/OA_MEDIA/fwkhp_formsfunc.gif"></div><div class="entryTitle" role="presentation" ';
      if(_agent.isChrome)
        elemStr += ' style="padding:5px 0px;"';
      elemStr += '>'+this['funcName']+'</div></a>';
    }
    else {
      var elemStr = '<a class="entryLink" tabindex="-1" href="#" title="'+this['funcName']+'"';
      if(_agent.isChrome)
        elemStr += ' style="display:inline-block;width:100%;position:relative;top:calc(100% - 32px);"'      
      elemStr += '><div class="entryImage" ';
      if(_agent.isChrome)
        elemStr += ' style="padding:5px 0px;"';
      elemStr += '><img class="image" alt="'+this['funcName']+'" src="/OA_MEDIA/fwkhp_sswafunc.gif">'+
      '</div><div class="entryTitle" ';
      if(_agent.isChrome)
        elemStr += ' style="padding:5px 0px;"';
      elemStr += ' role="presentation">'+this['funcName']+'</div></a>';
    }
    this.redirect = true;
    domElem.setAttribute('data-fulltext', this['funcName']);
    domElem.setAttribute("aria-haspopup", "false");
    if(!_agent.isChrome)
        domElem.style.display = 'table';
  }
  else {
    var respName = this['respName'];
    if(respName == null)
        respName = this['funcName'];
    var elemStr = '<a class="entryLink" style="display:grid;width:100%" tabindex="-1" href="#" title="'+respName+
    '"><div style ="width: 0px; height: 0px; visibility: hidden;"><img class="image" width="0px" height="0px" alt="'+respName+'" src="/OA_MEDIA/fwkhp_sswafunc.gif">';
    if(navigator.userAgent.indexOf("iPad")<0)
       elemStr += '</div><div role="presentation" class="OraTextTrimming" style="max-width:280px;">'+respName+'</div></a>';
    else
       elemStr += '</div><div role="presentation" style="max-width:280px;">'+respName+'</div></a>';
    this.redirect = false;
    domElem.setAttribute('data-fulltext', respName);
    domElem.setAttribute("aria-haspopup", "true");
  }
  domElem.className = 'listEntry';
  domElem.tabIndex = "0";
  domElem.setAttribute("role", "menuitem");
  domElem.innerHTML = elemStr;
  //addEventListener
  domElem.addEventListener('click',this.onclick.bind(this));
  
  this.dom = domElem;
  return domElem;
};

return element;
})();

function favoriteRedirect(event, url, newWindow) {
  if (newWindow == 'Y')
    window.open(url, "_blank");
  else
    window.open(url, "_self");
    
  elemStopPropogation((event || window.event));
}

var finese = {
  mvUp: "", mvDwn: "", mvTop: "", mvBottom: "", mngFAV: "", clrSrc: "",
  addFAV: "", mngNAV: "", srcInput: "", addAddFAV: null, mngFAVURL: "",
  addFAVURL: "", mngNAVURL: "", srchToolTip: "", isJTT: false,

  collectMessages: function(xmlDoc) {
    if (this.mvTop == "" || this.mvBottom == "" || this.mvUp == "" || this.mvDwn == "" || this.mngNAV == "" || this.mngFAV == "" || this.addFAV == "") {
      var mvLkp = xmlDoc.getElementsByTagName("LookupCode");
      var counter = 0;
      if(mvLkp != null) {
        for(var ind=0; ind<mvLkp.length; ind++) {
          if (mvLkp[ind].textContent != undefined) {
  			    if(mvLkp[ind].textContent == "MV_TOP") {
  				    this.mvTop = mvLkp[ind].nextSibling.textContent;
  				    counter++;
  			    }
  			    if(mvLkp[ind].textContent == "MV_BTM") {
  				    this.mvBottom = mvLkp[ind].nextSibling.textContent;
  				    counter++;
  			    }
            if(mvLkp[ind].textContent == "MOVE_UP") {
  				    this.mvUp = mvLkp[ind].nextSibling.textContent;
  				    counter++;
  			    }
            if(mvLkp[ind].textContent == "MOVE_DOWN") {
  				    this.mvDwn = mvLkp[ind].nextSibling.textContent;
  				    counter++;
  			    }
            if(mvLkp[ind].textContent == "SRCH_PG") {
  				    this.srcInput = mvLkp[ind].nextSibling.textContent;
  				    counter++;
  			    }
            if(mvLkp[ind].textContent == "MNG_FAV") {
              this.mngFAV = mvLkp[ind].nextSibling.textContent;
  				    counter++;
            }
            if(mvLkp[ind].textContent == "ADD_FAV") {
              this.addFAV = mvLkp[ind].nextSibling.textContent;
  				    counter++;
            }
            if(mvLkp[ind].textContent == "MNG_NAV") {
              this.mngNAV = mvLkp[ind].nextSibling.textContent;
  				    counter++;
            }
            if(mvLkp[ind].textContent == "CLR_SRCH") {
              this.clrSrc = mvLkp[ind].nextSibling.textContent;
  				    counter++;
            }
            if(mvLkp[ind].textContent == "SRCH_TOOL_TIP") {
              this.srchToolTip = mvLkp[ind].nextSibling.textContent;
  				    counter++;
            }            
  			    if(counter==10) {
              break;
            }
          }
        }
      }
    }
    var temp = xmlDoc.getElementsByTagName("MNGFAVURL");
    if ((this.mngFAVURL == "" && this.addFAVURL == "") && temp != null && temp[0] != null) {
      this.mngFAVURL = xmlDoc.getElementsByTagName("MNGFAVURL")[0].textContent;
      this.addFAVURL = xmlDoc.getElementsByTagName("ADDFAVURL")[0].textContent;
    }
    var temp = xmlDoc.getElementsByTagName("MNGNAVURL");
    if (this.mngNAVURL == "" && temp != null && temp[0] != null) {
      this.mngNAVURL = temp[0].textContent;
    }
    if (this.addAddFAV == null) {
      var temp = xmlDoc.getElementsByTagName("AddInfo");
      if (temp != null && temp[0] != null) {
        var isdirty = temp[0].childNodes[0].textContent;
        var isGlobalPage = temp[0].childNodes[1].textContent;
        var addFavorite = temp[0].childNodes[2].textContent;
        var isBookmarkablePg = temp[0].childNodes[3].textContent;
        if (("N"==isdirty)&&("Y"==addFavorite)&&("N"==isGlobalPage)&&("Y"==isBookmarkablePg)&&(!this.isJtt)) {
          this.addAddFAV = true;
        }
        else {
          this.addAddFAV = false;
        }
      }
    }
  },

  finesePopup: function(listId) {
    var arrId = [];
    var regId = [];
    var tempIndex = (parseInt(listId.substr(listId.length - 1))) + 1;
    if (listId.indexOf('fav') > -1) {
      arrId[0] = "favUpArrow";
      arrId[1] = "favDownArrow";
    }
    else {
      arrId[0] = "navUpArrow" + (tempIndex-1);
      arrId[1] = "navDownArrow" + (tempIndex-1);
      arrId[2] = "navTopArrow" + (tempIndex-1);
      arrId[3] = "navBottomArrow" + (tempIndex-1);
      regId[0] = "navTop" + (tempIndex-1);
      regId[1] = "navBottom" + (tempIndex-1);
    }
    if (listId === 'navListContainer0')
      search.initialize();
      
    var flag ;
    if((currentRequest.obj.childList == null) || ((currentRequest.obj.childList).length < 8) )
        flag = false;
    else
        flag = true;
        
    //var flag = ((currentRequest.obj.childList).length >= 8)?true:false;
    if (flag) {
      var element = document.getElementById(listId);
      var t = Object.create(navScroll.prototype);
      t.callArrowReset = resetArrowCall;
      t.initializeScrollList(element.childNodes[0], "vertical");
      resetArrowCall(listId, (element.childNodes[0]).scrollTop, elementScrollMaxH(element.childNodes[0]), 'vertical');
    }
    if(navigator.userAgent.indexOf("iPad") != -1)
    {
            var arrows = document.getElementsByClassName('mainNavUpArrow');
            for (i = 0; i < arrows.length; i++) 
               arrows[i].style.display = 'none';  
            arrows = document.getElementsByClassName('mainNavDownArrow');
            for (i = 0; i < arrows.length; i++) 
               arrows[i].style.display = 'none'; 
            arrows = document.getElementsByClassName('subUpArrow');
            for (i = 0; i < arrows.length; i++) 
               arrows[i].style.display = 'none'; 
            arrows = document.getElementsByClassName('subDownArrow');
            for (i = 0; i < arrows.length; i++) 
               arrows[i].style.display = 'none';
            var navBottom = document.getElementById('navBottom0');
            if(navBottom != null)
                navBottom.style.position = 'relative';
            var navImg = document.getElementById('manageNavigator');
            if(navImg != null)
                isBiDi()?navImg.style.right = 'auto':navImg.style.left = 'auto';
            var crossImg = document.getElementById('clrSearchText');
            if(crossImg != null)
                isBiDi() ? crossImg.style.left = "45px" : crossImg.style.right = "45px";
    }

    var element = document.getElementById(arrId[0]);
    element.alt = this.mvUp;
    element.title = this.mvUp;
    element.childNodes[0].alt = this.mvUp;
    element.childNodes[0].title = this.mvUp;
    if (flag) {
      /*element.onclick = function(event) {
        navScrollList(listId, "pgUp", "vertical", 20, 10, 0, resetArrowCall);
        elemStopPropogation((event || window.event));
      };*/
      var repeat = null;
      element.onmouseenter = function(event) {
        repeat = setInterval(function(){navScrollList(listId, "up", "vertical", 8, 10, 0, resetArrowCall)}, 8);
        elemStopPropogation((event || window.event));
      };
      element.onmouseleave = function(event) {
        clearInterval(repeat);
        elemStopPropogation((event || window.event));
      };
    }

    var element = document.getElementById(arrId[1]);
    element.alt = this.mvDwn;
    element.title = this.mvDwn;
    element.childNodes[0].alt = this.mvDwn;
    element.childNodes[0].title = this.mvDwn;
    if (flag) {
      /*element.onclick = function(event) {
        navScrollList(listId, "pgDwn", "vertical", 20, 10, 0, resetArrowCall);
        elemStopPropogation((event || window.event));
      };*/
      var repeat = null;
      element.onmouseenter = function(event) {
        repeat = setInterval(function(){navScrollList(listId, "down", "vertical", 8, 10, 0, resetArrowCall)}, 8);
        elemStopPropogation((event || window.event));
      };
      element.onmouseleave = function(event) {
        clearInterval(repeat);
        elemStopPropogation((event || window.event));
      };
    }

    if (arrId.length > 2) {
      var element = document.getElementById(arrId[2]);
      element.alt = this.mvTop;
      element.title = this.mvTop;
      element.childNodes[0].alt = this.mvTop;
      element.childNodes[0].title = this.mvTop;
      if (flag) {
        element.onclick = function(event) {
          navScrollList(listId, "home", "vertical", 80, 10, 0, resetArrowCall);
          elemStopPropogation((event || window.event));
        };
      }

      var element = document.getElementById(arrId[3]);
      element.alt = this.mvBottom;
      element.title = this.mvBottom;
      element.childNodes[0].alt = this.mvBottom;
      element.childNodes[0].title = this.mvBottom;
      if (flag) {
        element.onclick = function(event) {
          navScrollList(listId, "end", "vertical", 80, 10, 0, resetArrowCall);
          elemStopPropogation((event || window.event));
        };
      }

      if (listId.substr(listId.length - 1) == '0') {
        var element = document.getElementById('manageNavigator');
        element.href = this.mngNAVURL;
        element.alt = this.mngNAV;
        element.title = this.mngNAV;
        element.childNodes[0].alt = this.mngNAV;
        element.childNodes[0].title = this.mngNAV;
        if (isBiDi()) {
          (element.children[0]).src = "/OA_MEDIA/func_edit_16_rtl_act.png";
        }
        
        var element =  null;
        if(document.getElementById('clrSearchText') != null)
            element = (document.getElementById('clrSearchText')).children[0];
        else
            element = (document.getElementById('clrSearchTextMobile')).children[0];
        element.alt = this.clrSrc;
        element.title = this.clrSrc;        
      }
      
      var element = document.getElementById(regId[0]);
      element.onclick = function(event) {
        closeContainer("navContainer"+tempIndex, tempIndex);
        elemStopPropogation((event || window.event));
      };
      
      var element = document.getElementById(regId[1]);
      element.onclick = function(event) {
        closeContainer("navContainer"+tempIndex, tempIndex);
        elemStopPropogation((event || window.event));
      };
    }
    else {
      var element = document.getElementById('manageFavorite');
      if(listId == 'favMasonryListContainer0')
        element = document.getElementById('manageMasonryFav');
      element.href = this.mngFAVURL;
      element.alt = this.mngFAV;
      element.title = this.mngFAV;
      element.childNodes[0].alt = this.mngFAV;
      element.childNodes[0].title = this.mngFAV;
      if (isBiDi()) {
        (element.children[0]).src = "/OA_MEDIA/func_edit_16_rtl_act.png";
      }

      var element = document.getElementById('addFavorite');
      if (this.addAddFAV) {
        // element.href = this.addFAVURL;
        element.href = "javascript:openAddToFavoritePopup();";
        element.alt = this.addFAV;
        element.title = this.addFAV;
        element.childNodes[0].alt = this.addFAV;
        element.childNodes[0].title = this.addFAV;
        element.style.display = "";
      }
      else {        
        (element.parentNode).removeChild(element);
      }
    }
    keyBoardEvent(listId, (currentRequest.obj).dom);
    var navMobileHead = document.getElementById('navMobileHead'+(tempIndex-1));
    if(navMobileHead != null && currentMenuName != null)
        navMobileHead.innerHTML = currentMenuName;
    currentMenuName = null;
  }
};

function openAddToFavoritePopup(){
    showPopup(this,'addToFavPopup');
    var element = document.getElementById('favContainer0');
    var elementParent = document.getElementById('favContainer0').parentNode;
    elementParent.removeChild(element);
}

// create the outer structure of popup and handle the events

// structure object, it holds all the dom structure strings
var structure = {
  loadMsg: "",
  mainNavMenuMobile: '<div id="navTop0" class="topNavPopupMobile">'+
  '<table style="height: inherit;table-layout:  fixed;vertical-align:  middle;"><tbody><tr><td style="width:5%;">'+
  '<img src="/OA_MEDIA/back_chevron.png" id="prevNavMenu0" onclick="closeContainer(\'navContainer0\', 0);" role="button" alt="close" style="position:absolute;top:18px;"></td><td style="width:95%">'+
  '<input type="text" id="navSearch" title="" autocomplete="on" class="navSearch" ><a id="clrSearchTextMobile" style="display: none;">'+
  '<img src="/OA_MEDIA/func_close_16_act.png" alt="" ></a></td><td style="width:5%"><a id="navTopArrow0" class="mainNavUpArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereordertop_16_disabled.png" title="" alt="" style="display:none"></a></td><td style="width:5%"><a id="navUpArrow0" class="mainNavUpArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderup_16_disabled.png"  title="" alt="" style="display:none"></a></td></tr></table></div><div id="navListContainer0" class="navListMobile">'+
  '<div class="listContainer" data-listtype="resplist"><div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt="">'+
  '<div><span>'+'<<<LoadingMessage>>>'+'</span></div></div></div></div><div id="navBottom0" class="bottomPopup" ontouchstart="event.preventDefault();"><a id="navBottomArrow0" class="mainNavDownArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderbottom_16_disabled.png" title="" alt="" style="display:none"></a><a id="navDownArrow0" class="mainNavDownArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderdown_16_disabled.png" title="" alt="" style="display:none"></a><a id="manageNavigator" class="manageNavImage" style="left:auto;">'+
  '<img src="/OA_MEDIA/func_edit_16_act.png"></a></div>',
  subNavMenuMobile: '<div id="navTop<<#>>" class="subTopPopupMobile"><div class="navMobileHeadDiv" id="navMobileHead<<#>>"></div>' +
  '<img src="/OA_MEDIA/back_chevron.png" id="prevNavMenu<<#>>" onclick="closeContainer(\'navContainer<<#>>\', <<#>>);" role="button"'+
  'alt="close" style="position:absolute;top:18px;"><a id="navTopArrow<<#>>" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereordertop_16_disabled.png" title="" alt=""  style="display:none"></a><a id="navUpArrow<<#>>" class="subUpArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderup_16_disabled.png"  title="" alt=""  style="display:none"></a>'+
  '</div><div id="navListContainer<<#>>" class="navListMobile">'+
  '<div class="listContainer"><div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt=""><div><span>'+'<<<LoadingMessage>>>'+
  '</span></div></div></div></div><div id="navBottom<<#>>" class="subBottomPopupMoblie" ontouchstart="event.preventDefault();"><a id="navBottomArrow<<#>>" class="subDownArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderbottom_16_disabled.png" title="" alt="" style="display:none"></a><a id="navDownArrow<<#>>" class="subDownArrow" style="display:none">'+
  '<img src="/OA_MEDIA/func_shuttlereorderdown_16_disabled.png" title="" alt="" style="display:none"></a></div>',
    loadMsg: "",
  mainNavMenu: '<div id="navTop0" class="topNavPopup">'+
  '<input type="text" id="navSearch" title="" autocomplete="on" class="navSearch" ><a id="clrSearchText" style="display: none;">'+
  '<img src="/OA_MEDIA/func_close_16_act.png" alt="" ></a><a id="navTopArrow0" class="mainNavUpArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereordertop_16_disabled.png" title="" alt=""></a><a id="navUpArrow0" class="mainNavUpArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderup_16_disabled.png"  title="" alt=""></a></div><div id="navListContainer0">'+
  '<div class="listContainer" data-listtype="resplist"><div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt="">'+
  '<div><span>'+'<<<LoadingMessage>>>'+'</span></div></div></div></div><div id="navBottom0" class="bottomPopup"><a id="navBottomArrow0" class="mainNavDownArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderbottom_16_disabled.png" title="" alt=""></a><a id="navDownArrow0" class="mainNavDownArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderdown_16_disabled.png" title="" alt=""></a><a id="manageNavigator" class="manageNavImage">'+
  '<img src="/OA_MEDIA/func_edit_16_act.png"></a></div>',
  subNavMenu: '<div id="navTop<<#>>" class="subTopPopup"><a id="navTopArrow<<#>>" class="subUpArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereordertop_16_disabled.png" title="" alt=""></a><a id="navUpArrow<<#>>" class="subUpArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderup_16_disabled.png"  title="" alt=""></a>'+
  '<a id="navCloseArrow<<#>>" class="subUpArrow" href="#" onclick="closeContainer(\'navContainer<<#>>\',<<#>>);" style="'+(isBiDi()?'right':'left')+':80px;top:8px;">'+
  '<img src="/OA_HTML/cabo/images/alta/close_ena.png"  title="Close" alt="Close"></a>'+
  '</div><div id="navListContainer<<#>>">'+
  '<div class="listContainer"><div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt=""><div><span>'+'<<<LoadingMessage>>>'+
  '</span></div></div></div></div><div id="navBottom<<#>>" class="subBottomPopup"><a id="navBottomArrow<<#>>" class="subDownArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderbottom_16_disabled.png" title="" alt=""></a><a id="navDownArrow<<#>>" class="subDownArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderdown_16_disabled.png" title="" alt=""></a></div>',
  mainFavMenu: '<div id="favTopBar" class="topPopup"><a id="favUpArrow" class="mainUpArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderup_16_disabled.png" title="" alt=""></a></div><div id="favListContainer0" style="height:500px;">'+
  '<div class="listContainer"><div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt=""><div><span>'+'<<<LoadingMessage>>>'+
  '</span></div></div></div></div><div id="favBottomBar" class="bottomPopup"><a id="favDownArrow" class="mainDownArrow">'+
  '<img src="/OA_MEDIA/func_shuttlereorderdown_16_disabled.png" title="" alt=""></a><a id="manageFavorite" class="manageImage">'+
  '<img src="/OA_MEDIA/func_edit_16_act.png" title="" alt=""></a><a id="addFavorite" class="manageImage" style="display: none">'+
  '<img src="/OA_MEDIA/add_to_favorites_24.png" width="20px" height="20px" title="" alt=""></a></div>',
  isNav: null,
  oppo: false,

  assembleStruct: function(contId) {
    if (contId == 'favContainer0') {
      var anchor = document.getElementById('SFAV');
      var container = document.createElement('div');
      container.id = contId;
      container.className = "mainPopup";
      var str = (this.mainFavMenu).replace(/<<<LoadingMessage>>>/i, this.loadMsg);
      container.innerHTML = str;
      anchor.appendChild(container);
      container.children[1].children[0].style.setProperty("height","450px","important");
      positionPopUp(container, 'SFAV');
    }
    else if (contId == 'favMasonryContainer0') {
      var anchor = document.getElementById('SFAVMASONRY');
      var container = document.createElement('div');
      container.id = contId;
      container.className = "mainPopup";
      var str = (this.mainFavMenu).replace('favList', 'favMasonryList').replace(/<<<LoadingMessage>>>/i, this.loadMsg);
      str = str.replace('manageFavorite','manageMasonryFav');
      container.innerHTML = str;
      anchor.appendChild(container);
      container.children[1].children[0].style.setProperty("height","450px","important");
      positionPopUp(container, 'SFAVMASONRY');
    }
    else if (contId == 'navContainer0') {
      var anchor = document.getElementById('SNAV');
      var container = document.createElement('div');
      container.id = contId;
      container.className = "mainPopup";
      var str = "";
      if(isMobilePhone())
        str = (this.mainNavMenuMobile).replace(/<<<LoadingMessage>>>/i, this.loadMsg);
      else
        str = (this.mainNavMenu).replace(/<<<LoadingMessage>>>/i, this.loadMsg);
      container.innerHTML = str;
      anchor.appendChild(container);
      if(document.getElementById('prevNavMenu0') != null)
      {
        if(isBiDi())
        {
            document.getElementById('prevNavMenu0').src = '/OA_MEDIA/forward_chevron.png';
            document.getElementById('prevNavMenu0').style.right = "10px";
        }
        else
            document.getElementById('prevNavMenu0').style.left = "10px";
      }      
      positionPopUp(container, 'SNAV');
    }
    else {
      var id = parseInt(contId.substr(contId.length - 1));
      var anchor = document.getElementById('navListContainer' + (id-1));
      var container = document.createElement('div');
      container.id = contId;
      if(isMobilePhone())
        container.className = 'subPopupMobile';
      else if (id == 1) {
        container.className = "subPopup";
      }
      else {
        if (positionPopUp(container, 'navContainer'+(id-1))) {
          container.className = "subPopup2";
          structure.oppo = false;
        }
        else {
          container.className = "subPopup2Rev";
          structure.oppo = true;
        }
        if(navigator.userAgent.indexOf("iPad") != -1)
            container.style.setProperty("width","300px","important");
      }
      var stringNav = "";
      if(isMobilePhone())
        stringNav = (this.subNavMenuMobile).replace(/<<#>>/ig, id.toString());
      else
        stringNav = (this.subNavMenu).replace(/<<#>>/ig, id.toString());
      stringNav = (stringNav).replace(/<<<LoadingMessage>>>/i, this.loadMsg);
      container.innerHTML = stringNav;
      anchor.appendChild(container);
      if(document.getElementById('prevNavMenu'+id) != null)
      {
        if(isBiDi())
        {
            document.getElementById('prevNavMenu'+id).src = '/OA_MEDIA/forward_chevron.png';
            document.getElementById('prevNavMenu'+id).style.right = "10px";
        }
        else
            document.getElementById('prevNavMenu'+id).style.left = "10px";
      }
      if(isMobilePhone())
        adjustNavigatorPopupSize('navListContainer' + id);
    }
  },

  isRESTRequired: function(contId, nextContId) {
    var temp = document.getElementById(contId);
    if (temp == null || temp == undefined) {
      this.assembleStruct(contId);
      return true;
    }
    else {
      var navMobileHead = document.getElementById('navMobileHead'+(parseInt(contId.substr(contId.length - 1))));
      if(navMobileHead != null)
        navMobileHead.innerHTML = "";
      temp.style.display = "";
      if (nextContId != null) {
        if (contId == 'navContainer0' || contId == 'favContainer0' || contId == 'favMasonryContainer0')
          closeContainer(nextContId, 0);
        else
          closeContainer(nextContId, (parseInt(contId.substr(contId.length - 1))));
      }
      if ((contId == 'navContainer0' && currentRequest.mainNavError) || (contId == 'favContainer0' && currentRequest.mainFavError)  || (contId == 'favMasonryContainer0' && currentRequest.mainFavError)) {
        (temp.parentNode).removeChild(temp);
        this.assembleStruct(contId);
        return true;
      }
      else if (contId == 'navContainer0' || contId == 'favContainer0' || contId == 'favMasonryContainer0') {
        if (((temp.childNodes[1]).childNodes[0]).firstElementChild)
          (((temp.childNodes[1]).childNodes[0]).firstElementChild).focus();
          if (contId == 'navContainer0')
                adjustNavigatorPopupSize('navListContainer0');
        return false;
        }
      else {
        if (currentRequest.obj.childList != null) {
          if (currentRequest.obj.isError) {
            (temp.parentNode).removeChild(temp);
            this.assembleStruct(contId);
            return true;
          }
          else {
            currentRequest.populateDOMPanel();
            finese.finesePopup(currentRequest.panelId);
            return false;
          }
        }
        else {
          return true;
        }
      }
    }
  }
};

var currentRequest = {
  obj: elementEntry,
  panelId: null,
  requestType: null,
  mainNavError: false,
  mainFavError: false,

  onSuccess: function(xmlDoc) {

    //populate list entries in object
    finese.collectMessages(xmlDoc);
    var containerId = "";
    this.obj.childList = new Array();
    var protoObject = this.obj;
    var entryList = xmlDoc.getElementsByTagName("ROOTMENU");
    if (entryList !== null && entryList.length > 0) {
            // add menu to list
      var menuList = xmlDoc.getElementsByTagName('MENU');
      if (menuList !== null && menuList.length > 0) {
        for (var iteration = 0; iteration < menuList.length; iteration++) {
          var temp = Object.create(protoObject, {
            respName: {
              value: menuList[iteration].childNodes[0].textContent,
              writable: true,
              enuberable: true,
              configurable: false
            },
            macKey: {
              value: menuList[iteration].childNodes[2].textContent,
              writable: true,
              enuberable: true,
              configurable: false
            },
            menuId: {
              value: menuList[iteration].childNodes[1].textContent,
              writable: true,
              enuberable: true,
              configurable: false
            }
          });
          temp.childList = null;
          this.obj.childList.push(temp);
        }
      }
      // add function to list
      var fcName = xmlDoc.getElementsByTagName("FUNCTIONNAME");
      if (fcName != null && fcName.length > 0) {
        var fcURL = xmlDoc.getElementsByTagName("FUNCTIONURL");
        var fcType = xmlDoc.getElementsByTagName("FUNCTIONTYPE");
        var fcDesc = xmlDoc.getElementsByTagName("FUNCTIONDESC");
        for (var iteration = 0; iteration < fcName.length; iteration++) {
          var temp = Object.create(elementEntry.prototype, {
            funcName: {
              value: fcName[iteration].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcURL: {
              value: fcURL[iteration].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcType: {
              value: fcType[iteration].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcDesc: {
              value: fcDesc[iteration].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            macKey: {
              value: null,
              writable: true,
              enuberable: true,
              configurable: false
            },
            menuId: {
              value: null,
              writable: true,
              enuberable: true,
              configurable: false
            }
          });
          temp.childList = null;
          this.obj.childList.push(temp);
        }
      }
      containerId = this.panelId;
    }
    var entryList = xmlDoc.getElementsByTagName("RESP");
    if (entryList !== null && entryList.length > 0) {
      // create new element which will extend current obj
      for (var iteration = 0; iteration < entryList.length; iteration++) {
        var temp = Object.create(elementEntry.prototype, {
          respName: {
            value: entryList[iteration].childNodes[0].textContent,
            writable: true,
            enuberable: true,
            configurable: false
          },
          respId: {
            value: entryList[iteration].childNodes[1].textContent,
            writable: false,
            enuberable: true,
            configurable: false
          },
          respAppId: {
            value: entryList[iteration].childNodes[2].textContent,
            writable: false,
            enuberable: true,
            configurable: false
          },
          secGrpId: {
            value: entryList[iteration].childNodes[3].textContent,
            writable: false,
            enuberable: true,
            configurable: false
          },
          macKey: {
            value: entryList[iteration].childNodes[4].textContent,
            writable: true,
            enuberable: true,
            configurable: false
          },
          menuId: {
            value: "-1",
            writable: true,
            enuberable: true,
            configurable: false
          }
        });
        this.obj.childList.push(temp);
      }
      containerId = 'navListContainer0';
    }

      var entryList = xmlDoc.getElementsByTagName('Favorite');
      //when there are no favorites added for a user, we still need to open the popup
      var favParent = xmlDoc.getElementsByTagName('Favorites');
      if(favParent !== null && favParent.length > 0)
        containerId = (document.getElementById('ResponsiveMenuImg') == null || document.getElementById('ResponsiveMenuImg').style.display=='none')?'favListContainer0':'favMasonryListContainer0';
      if (entryList !== null && entryList.length > 0) {
      // create new element which will extend current obj
      for (var iteration = 0; iteration < entryList.length; iteration++) {
          var temp = Object.create(protoObject.prototype, {
            funcName: {
              value: entryList[iteration].childNodes[0].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcURL: {
              value: entryList[iteration].childNodes[1].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcType: {
              value: entryList[iteration].childNodes[2].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            newWin: {
              value: entryList[iteration].childNodes[3].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            }
          });
          this.obj.childList.push(temp);
        }
        containerId = (document.getElementById('ResponsiveMenuImg') == null || document.getElementById('ResponsiveMenuImg').style.display=='none')?'favListContainer0':'favMasonryListContainer0';
      }
      
      var entryList = xmlDoc.getElementsByTagName('FUNCTION');
      if (entryList !== null && entryList.length > 0) {
      // create new element which will extend current obj
      for (var iteration = 0; iteration < entryList.length; iteration++) {
          var temp = Object.create(protoObject, {
            funcName: {
              value: entryList[iteration].childNodes[0].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcURL: {
              value: entryList[iteration].childNodes[1].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            },
            funcType: {
              value: entryList[iteration].childNodes[2].textContent,
              writable: false,
              enuberable: true,
              configurable: false
            }
          });
          this.obj.childList.push(temp);
        }
        containerId = 'navListContainer0';
      }

      // create DOM element on browser

      this.populateDOMPanel();
      finese.finesePopup(containerId);
      this.obj.isError = false;
      if (this.panelId == 'navListContainer0') {
        this.mainNavError = false;
        adjustNavigatorPopupSize(this.panelId);
      }
      else if (this.panelId == 'favListContainer0') {
        this.mainFavError = false;
      }
      else if (this.panelId == 'favMasonryListContainer0') {
        this.mainFavError = false;
      }
    },

  onErrorResponse: function(xmlDoc) {
    var exception = xmlDoc.getElementsByTagName("EXCEPTION");
    if (exception.length > 0) {
      finese.collectMessages(xmlDoc);
    }
    var error = xmlDoc.getElementsByTagName("error");
    var noRecords = xmlDoc.getElementsByTagName("NORECORDS");
    if (exception.length == 0 && error.length == 0 && noRecords.length == 0)
      return null;
    var errorMsg = [];
    for (var iteration=0; iteration<exception.length; iteration++) {
      errorMsg.push(exception[iteration].childNodes[0].textContent);
    }
    for (var iteration=0; iteration<error.length; iteration++) {
      errorMsg.push(error[iteration].childNodes[0].textContent);
    }
    if(noRecords.length > 0)
        errorMsg.push(noRecords[0].textContent);
    this.populateDOMPanel(errorMsg);
    if (exception.length > 0) {
        finese.finesePopup(this.panelId);
    }
    this.obj.isError = true;
    if (this.panelId == 'navListContainer0') {
      this.mainNavError = true;
    }
    else if (this.panelId == 'favListContainer0') {
      this.mainFavError = true;
    }
    else if (this.panelId == 'favMasonryListContainer0') {
      this.mainFavError = true;
    }
  },

  populateDOMPanel: function() {
    var panel = document.getElementById(this.panelId).childNodes[0];
    while (panel.hasChildNodes()) {
      panel.removeChild(panel.lastChild);
    }
    //panel.innerHTML = "";
    if (arguments != null && arguments.length > 0 && arguments[0] != null) {
      var i = 0;
      for (i = 0; i < arguments.length; i++) {
        var temp = document.createElement('div');
        temp.style.color = "black";
        temp.style.margin = "10px";
        temp.style.whiteSpace = "normal";
        temp.style.wordWrap = "break-word";
        temp.appendChild(document.createTextNode(arguments[i]));
        panel.appendChild(temp);
      }
    }
    else {
      var maxLen = 0;
      (this.obj.childList).forEach(function(curr) {
        var itemDiv = curr.getDOM();
        if(itemDiv != null){
            panel.appendChild(itemDiv);
            //truncating text with ellipses. Adding exception for iPad.
            if(curr.hasOwnProperty('funcType'))
            {
                if(maxLen == 0)                
                    maxLen = getMaximumCharacters(itemDiv);
//                var widthMultiplier = (itemDiv.getAttribute('aria-haspopup') == 'true' && (navigator.userAgent.indexOf("iPad")<0)) ? 1 : 1.7 ;
                  var container = itemDiv.firstElementChild.lastElementChild;
                  var truncText = container.textContent.substring(0, parseInt(maxLen)-3);
                  if(truncText != container.textContent)
                    container.textContent = truncText + "..."; 
            }
        }
      });
    }
    if (panel.firstElementChild && !search.req)
      (panel.firstElementChild).focus();
  },

  initRequest: function(event) {
    var index = getContainerIndex(event) + 1;
    this.panelId = "navListContainer" + index;
    var temp = document.getElementById(this.panelId);
    if (temp != null && temp != undefined) {
      var panel = temp.childNodes[0];
      while (panel.hasChildNodes()) {
        panel.removeChild(panel.lastChild);
      }
      panel.innerHTML = '<div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt=""><div><span>'+structure.loadMsg+
                        '</span></div></div>';
    }
    var retVal = structure.isRESTRequired(('navContainer'+ index), ('navContainer' + (index+1)));
    if(document.getElementById('navContainer'+index) != null)
    {
          if(index != 0 && isMobilePhone())
            document.getElementById('navContainer'+index).style.top =  "-1px";
          else if(index == 1)
          {
              var target = null;
              if (event.target)
                target = event.target;
              else if (event.srcElement)
                target = event.srcElement;
    
              if(target.getElementsByClassName('OraTextTrimming').length > 0)
                target = target.getElementsByClassName('OraTextTrimming')[0];

              var winH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
              var nextTop = target.parentElement.getBoundingClientRect().top + 10;
              if((nextTop + 425) > winH && nextTop > 415)
                nextTop = target.parentElement.getBoundingClientRect().top - 415;
              document.getElementById('navContainer'+index).style.top =  nextTop + "px";
          }
    }
    
    return retVal;

    /*var panel = (document.getElementById(id)).childNodes[0];
    while (panel.hasChildNodes()) {
      panel.removeChild(panel.lastChild);
    }*/
  }
};

function getContainerIndex(event) {
  if (!event)
    event = window.event;
  var target = null;
  if (event.target)
    target = event.target;
  else if (event.srcElement)
    target = event.srcElement;
  var id = null;
  while (target != null) {
    if (target.id != null && (target.id).indexOf('ListContainer') > -1) {
      id = target.id;
      break;
    }
    else {
      target = target.parentNode;
    }
  }
  return parseInt(id.substr(id.length - 1));
}

var search = {
  original: null,
  srcStr: null,
  srcElement: null,
  req: false,
  
  initialize: function() {
    var inputE = document.getElementById('navSearch');
    inputE.placeholder = finese.srcInput;
    inputE.title = finese.srchToolTip;
    
    if(_agent.isIE){
        inputE.onclick = function() {
            this.select();
        };
    }
    
    this.srcElement = Object.create(elementEntry.prototype);
    
    var cross = document.getElementById('clrSearchText') || document.getElementById('clrSearchTextMobile');
    var that = this;
    
    cross.onclick = function() {
      that.closeSearch();
    };
    
    inputE.onkeydown = function(event) {
      var inputE = (event || window.event).target;
      if(inputE == null)
        inputE = (event || window.event).srcElement;

      var Mkey;
      if (window.event)
        Mkey = window.event.keyCode;
      else if(event)
        Mkey = event.which;
      
      if (Mkey == 13)
      {
            if(searchTimer != null) 
                clearTimeout(searchTimer);      
            elemStopPropogation((event || window.event));          
            event.preventDefault();
            return;
      }
      
      if (Mkey == 8 || Mkey == 46)
      {
            if(searchTimer != null)
                clearTimeout(searchTimer);
            if(inputE.value == null || inputE.value.length < 2)
            {
                that.closeSearch();
                elemStopPropogation((event || window.event));
                event.preventDefault();
                return;
            }
      }
    }
    inputE.oninput = function() {
    if(searchedText == inputE.value)
        return;
      closeContainer("navContainer1", 1);
      cross.style.display = "";
      inputE.style.background = "white";
      var text = inputE.value;
      if (text === "") {
        that.closeSearch();
      }
      else if (text.length <= 2) {
        return null;
      }
      else if (text.indexOf("%") > 0 || text.indexOf("%") < 0) {
        if(searchTimer != null) 
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function(){              
                that.bkpList();
                that.srcStr = inputE.value;
                that.req = true;
                searchedText = inputE.value;
                searchedText = searchedText.replace(/&/g, '&amp;');
                searchedText = searchedText.replace(/</g, '&lt;');                
                var newRest = Object.create(restObject.prototype);
                newRest.params = {
                  param1: "RESPLIST",
                  param2: "FUNCLIST",
                  param3: searchedText
                };
                newRest.postRequest();
                searchTimer = null;
            }, 750);
      }
    };
  },
  
  closeSearch: function() {
    var iter = 0;
    var flag = false;
    if (ajax != null && ajax.readyState != ajax.DONE)
      ajax.abort();
    
    if (this.original) {
      var cont = document.getElementById('navListContainer0');
      for (iter = 0; iter < (cont.childNodes).length; iter++) {
        if ((cont.childNodes[iter]).hasAttribute('data-listtype')) {
          if ((cont.childNodes[iter]).getAttribute('data-listtype') == 'funclist')
            cont.removeChild(cont.childNodes[iter]);
          else if ((cont.childNodes[iter]).getAttribute('data-listtype') == 'resplist')
            flag = true;
        }
      }
      if (!flag && cont.childNodes.length > 0)
        cont.insertBefore(this.original, cont.childNodes[0]);
      else if (!flag)
        cont.appendChild(this.original);
    }
      
    var cross = document.getElementById('clrSearchText') || document.getElementById('clrSearchTextMobile');
    cross.style.display = "none";
    var inputE = document.getElementById('navSearch');
    inputE.value = "";
    inputE.style.removeProperty('background');
    this.original = null;
    this.req = false;
    searchedText = null;
  },
  
  bkpList: function() {
    this.srcElement.childList = null;
    currentRequest.panelId = 'navListContainer0';
    currentRequest.obj = this.srcElement;
    
    var cont = document.getElementById('navListContainer0');
    for (iter = 0; iter < (cont.childNodes).length; iter++) {
      if ((cont.childNodes[iter]).hasAttribute('data-listtype')) {
        if ((cont.childNodes[iter]).getAttribute('data-listtype') == 'funclist')
          cont.removeChild(cont.childNodes[iter]);
        else if ((cont.childNodes[iter]).getAttribute('data-listtype') == 'resplist')
          this.original = cont.removeChild(cont.childNodes[iter]);     
      }
    }

    var loading = document.createElement('div');
    loading.className = 'listContainer';
    loading.setAttribute('data-listtype', 'funclist');
    loading.innerHTML = '<div class="loadingDiv"><img src="/OA_HTML/cabo/images/alta/spinner.gif" style="padding:5px" alt="">'+'<div><span>'+
      structure.loadMsg+'</span></div></div>';
    if ((cont.childNodes).length > 0)
      cont.insertBefore(loading, cont.childNodes[0]);
    else
      cont.appendChild(loading);

  }
};

// on page load update parameters present in the page DOM
// restURL, processing message, isJTT and blockNav
function initializePopup(restURL, isJTT, loadMsg) {
  restObject.prototype.restURL = unescape(restURL);
  finese.isJTT = isJTT;
  structure.loadMsg = loadMsg;
}

function resetArrowCall(id, curLev, maxLev, orient) {
  if (id.indexOf('favListContainer') > -1 || id.indexOf('favMasonryListContainer') > -1) {
    var up = document.getElementById('favUpArrow').childNodes[0];
    var down = document.getElementById('favDownArrow').childNodes[0];
    var top = {};
    var bottom = {};
  }
  else {
    var postfix = id.substr(id.length - 1);
    var up = document.getElementById('navUpArrow'+postfix).childNodes[0];
    var down = document.getElementById('navDownArrow'+postfix).childNodes[0];
    var top = document.getElementById('navTopArrow'+postfix).childNodes[0];
    var bottom = document.getElementById('navBottomArrow'+postfix).childNodes[0];
  }
  var start = 0;
  var end = maxLev;
  
  var prevUp = (up.src).indexOf("disabled");
  var prevDwn = (up.src).indexOf("disabled");

  if (Math.abs(curLev - start) <= 3) {
    up.src = '/OA_MEDIA/func_shuttlereorderup_16_disabled.png';
    top.src = '/OA_MEDIA/func_shuttlereordertop_16_disabled.png';
  }
  else {
    up.src = '/OA_MEDIA/func_shuttlereorderup_16_act.png';
    top.src = '/OA_MEDIA/func_shuttlereordertop_16_act.png';
  }
  if (Math.abs(end - curLev) <= 3) {
    down.src = '/OA_MEDIA/func_shuttlereorderdown_16_disabled.png';
    bottom.src = '/OA_MEDIA/func_shuttlereorderbottom_16_disabled.png';
  }
  else {
    down.src = '/OA_MEDIA/func_shuttlereorderdown_16_act.png';
    bottom.src = '/OA_MEDIA/func_shuttlereorderbottom_16_act.png';
  }
  
  var nextUp = (up.src).indexOf("disabled");
  var nextDwn = (up.src).indexOf("disabled");
  
  if (arguments.length < 5) {
    if (!(((prevUp > -1) && (nextUp > -1)) || ((prevDwn > -1) && (nextDwn > -1)))) {
      closeContainer("navContainer"+(parseInt(postfix) + 1), (parseInt(postfix) + 1));
    }
  }
}

// set position of container dependent on parent element (pId)
// need to reformat this code to take the correct position
function positionPopUp(container, pId) {
  var parent = document.getElementById(pId);
  var pPos = parent.getBoundingClientRect();
  
  if(pId == 'SNAV')
  {
    container.style.top = "-10px";
    container.style.position = "absolute";
    container.style.height = "99vh";
    if (isBiDi())
        container.style.right = "-1px";
    else
        container.style.left = "-1px";
    
    var navCont = document.getElementById('navContainer0');
    adjustNavigatorPopupSize('navListContainer0');
    if(!isMobilePhone())
    {
        if(navigator.userAgent.indexOf("iPad") != -1)
            container.style.setProperty("width", "300px","important");
        else
            container.style.setProperty("width", "380px","important");      
    }
  }
  if (pId == 'SFAV' || pId == 'SFAVMASONRY') {
    var top = pPos.height;
    container.style.top = top + "px";
    
    var mode = parent.getAttribute('data-displayMode');
    var addon = 0;
    if (mode == 'MED') {
      var p1 = parent.childNodes[0];
      addon = (p1.getBoundingClientRect().width)/2 + 2;
      if (isBiDi())
        addon += 4;
    }
    else {
      if (mode == 'REG')
        var p1 = parent.childNodes[1];
      else if (mode == 'SML')
        var p1 = parent.childNodes[0];
      addon = p1.getBoundingClientRect().width;
    }
    if (isBiDi()) {
      if(pId == 'SNAV'){
        container.style.right = '0px';
        //(container.childNodes[0]).style.left = (255+addon)+'px';    //notch positioning
      }
      else{
       if(pId != 'SFAVMASONRY' && document.getElementById('ResponsiveMenuImg') != null && document.getElementById('ResponsiveMenuImg').style.display != 'none')
        {
            container.style.left = '10%';
            container.style.top = '80px';
        }
        else
        {
            container.style.right = '';
            container.style.left = '5px';
           // (container.childNodes[0]).style.right = (180+6+addon)+'px';    //notch positioning
        }
      }
    }
    else {
      if(pId == 'SNAV'){
        container.style.left = '0px';
        //(container.childNodes[0]).style.left = (addon)+'px';    //notch positioning
      }
      else{
        if(pId != 'SFAVMASONRY' && document.getElementById('ResponsiveMenuImg') != null && document.getElementById('ResponsiveMenuImg').style.display != 'none')
        {
            container.style.left = '-65%';
            container.style.top = '80px';
            (container.childNodes[0]).style.left = (100+addon)+'px';    //notch positioning            
        }
        else
        {
            container.style.right = '20px';
            container.style.left = '';
            //(container.childNodes[0]).style.left = (200+addon)+'px';    //notch positioning
        }
      }
    }
  }
  
  else {
    if (!isBiDi()) {
      return ((structure.oppo)?(pPos.left < 150):(window.innerWidth - pPos.right > 150));  //if true it will flow as usual
    }
    else {
      return ((structure.oppo)?(window.innerWidth - pPos.right < 150):(pPos.left > 150));  //if true it will flow as usual
    }
  }
}

function keyBoardEvent(listId, sourceElem) {
  var contList = document.getElementById(listId);
  var cont = document.getElementById(listId.substr(0, 3) + 'Container' + listId.substr(listId.length - 1));
  if (listId.indexOf('Masonry') > -1)
    cont = document.getElementById('favMasonryContainer' + listId.substr(listId.length - 1));    
  contList.onkeydown = function(event) {
    var Mkey;
    if (window.event)
      Mkey = window.event.keyCode;
    else if(event)
      Mkey = event.which;
      
    var altPressEvent;
    if (window.event)
      altPressEvent = window.event.altKey;
    else if(event)
      altPressEvent = event.altKey;
    
    var tar = null;
    if ((event || window.event).target)
      tar = (event || window.event).target;
    else
      tar = (event || window.event).srcElement;
      
    if (Mkey == 13 || Mkey == 32 ) {  //enter key or spacebar to open
      tar.click();
    }
    else if (((isBiDi() && !structure.oppo)?(Mkey == 37):(Mkey == 39)) && tar.getAttribute("aria-haspopup") == "true"){
      tar.click(); //right and left keys for responsibilities
    }   
    else if (Mkey == 38) {  //up key
      if (tar.previousElementSibling != null)
        (tar.previousElementSibling).focus();
      else
        ((this.childNodes[0]).lastElementChild).focus();
    }
    else if (Mkey == 40) {   //down key
      if (tar.nextElementSibling != null)
        (tar.nextElementSibling).focus();
      else
        ((this.childNodes[0]).firstElementChild).focus();
    }
    else if (Mkey == 36) {  // home key
      ((this.childNodes[0]).firstElementChild).focus();
    }
    else if (Mkey == 35) {  // end key
      ((this.childNodes[0]).lastElementChild).focus();
    }
    else if (Mkey == 33) {  // pgUp key
      var count = 0;
      var temp = tar;
      while (count < 9 && temp.previousElementSibling != null) {
        temp = temp.previousElementSibling;
        count++;
      }
      temp.focus();
    }
    else if (Mkey == 34) {  // pgDwn key
      var count = 0;
      var temp = tar;
      while (count < 9 && temp.nextElementSibling != null) {
        temp = temp.nextElementSibling;
        count++;
      }
      temp.focus();
    }
    else if (!altPressEvent && Mkey >= 65 && Mkey <= 90) {
      var time = new Date().getTime();
      if (charSearch.time == null){
        charSearch.time = new Date().getTime();
        charSearch.str = "";
        charSearch.count = 0;
      }
      if(charSearchTimer == null)
        charSearchTimer = setTimeout(function(){charSearch.time = null;charSearch.count = 0; charSearch.str = "";}, 1000);
      var str = "";
      if (time - charSearch.time > 1000) {
        str = String.fromCharCode(Mkey);
        charSearch.str = str;
        charSearch.count = 0;
      }
      else {
          if(charSearch.str != null && charSearch.str.length == 1 &&
            charSearch.str.toLowerCase() == String.fromCharCode(Mkey).toLowerCase())
            charSearch.count = charSearch.count + 1;
        else  
        {
            charSearch.str = charSearch.str + String.fromCharCode(Mkey);
            charSearch.count = 0;
        }
        str = charSearch.str;
      }
      charSearch.time = new Date().getTime();
      var temp = (this.childNodes[0]).firstElementChild;
      var matchedChild = null;
      var totCount = charSearch.count;
      while (temp != null) {
        var text = temp.getAttribute('data-fullText');
        if (text.toLowerCase().indexOf(str.toLowerCase()) == 0) {
            matchedChild = temp;
            if(totCount <= 0)
            {
                temp.focus();
                console.log('temp :- ' + text);
                break;
            }
            else
                totCount--;
        }
        temp = temp.nextElementSibling;
      }
      if(temp == null && totCount > 0 && matchedChild != null)
      {
            matchedChild.focus();
            console.log('matchedChild :- ' + matchedChild.getAttribute('data-fullText'));
      }
    }
    if ((event || window.event).preventDefault)
      (event || window.event).preventDefault();
    (event || window.event).returnValue = false;
    resetArrowCall(listId, (contList.childNodes[0]).scrollTop, elementScrollMaxH(contList.childNodes[0]), 'vertical', true);
  };
  
  cont.onkeydown = function(event) {
    var Mkey;
    if (window.event)
      Mkey = window.event.keyCode;
    else if(event)
      Mkey = event.which;
      
    var altPressEvent;
    if (window.event)
      altPressEvent = window.event.altKey;
    else if(event)
      altPressEvent = event.altKey;
      
    var shiftKey;
    if (window.event)
      shiftKey = window.event.shiftKey;
    else if(event)
      shiftKey = event.shiftKey;
      
    var tar = null;
    if ((event || window.event).target)
      tar = (event || window.event).target;
    else
      tar = (event || window.event).srcElement;
    
    if ((Mkey == 27)) {  //escape 
      closeContainer(cont.id, parseInt(listId.substr(listId.length - 1)));
      if (listId == 'navListContainer0')
        (document.getElementById('SNAV')).focus();
      else if (listId == 'favListContainer0')
        (document.getElementById('SFAV')).focus();
      else if (listId == 'favMasonryListContainer0')
        (document.getElementById('SMASONRYFAV')).focus();
      else
        sourceElem.focus();
    }
    else if (((isBiDi() && !structure.oppo)?(Mkey == 39):(Mkey == 37))){ //Right or Left key
      if(tar.id != 'navSearch') //search textbox
        closeContainer(cont.id, parseInt(listId.substr(listId.length - 1)));
    
      if ((listId == 'navListContainer0') && (tar.id != 'navSearch'))
        (document.getElementById('SNAV')).focus();
      else if (listId == 'favListContainer0')
        (document.getElementById('SFAV')).focus();
      else if (listId == 'favMasonryListContainer0')
        (document.getElementById('SMASONRYFAV')).focus();
      else if(sourceElem != null)
        sourceElem.focus();  
    }
    else if(Mkey == 9){ //tab key
        var bottombar = (listId == 'navListContainer0') ? "navBottom0" : null;
        if(bottombar == null && ((listId == 'favListContainer0') || (listId == 'favMasonryListContainer0')))
            bottombar = "favBottomBar";
            
        if(tar.className == 'listEntry' && (listId == 'navListContainer0')){
            if(shiftKey)
                (document.getElementById('navSearch')).focus();
            else
                (document.getElementById('manageNavigator')).focus();
        }
        else if(tar.className == 'listEntry' && (listId == 'favListContainer0')){
            if(shiftKey)
                (document.getElementById('SFAV')).focus();
            else
                (document.getElementById('manageFavorite')).focus();
        }
        else if(tar.className == 'listEntry' && (listId == 'favMasonryListContainer0')){
            if(shiftKey)
                (document.getElementById('SMASONRYFAV')).focus();
            else
                (document.getElementById('manageMasonryFav')).focus();
        }
        else if(bottombar != null && document.getElementById(bottombar).lastElementChild.isEqualNode(tar) && !shiftKey){
            closeContainer(cont.id, parseInt(listId.substr(listId.length - 1)));
        }
    }
    
    else if (altPressEvent) {
      if (listId == 'navListContainer0') {
        if (Mkey == 83)  //search
          (document.getElementById('navSearch')).focus();
        if (Mkey == 77)  //manage
          (document.getElementById('manageNavigator')).click();
      }
      else if (listId == 'favListContainer0') {
        var temp = document.getElementById('addFavorite');
        if (Mkey == 65 && temp.style.display != "none")  //add
          temp.click();
        if (Mkey == 77)  //manage
          (document.getElementById('manageFavorite')).click();
      }  
      else if (listId == 'favMasonryListContainer0') {
        var temp = document.getElementById('addFavorite');
        if (Mkey == 65 && temp.style.display != "none")  //add
          temp.click();
        if (Mkey == 77)  //manage
          (document.getElementById('manageMasonryFav')).click();
      }
    }
    elemStopPropogation((event || window.event));
    resetArrowCall(listId, (contList.childNodes[0]).scrollTop, elementScrollMaxH(contList.childNodes[0]), 'vertical', true);
  };
}

var charSearch = {
  str: "",
  time: null,
  count:0
};

function navfavClickEvent() {
  if (document.getElementById('SNAV')) {
    (document.getElementById('SNAV')).onclick = function(event) {
      closeContainer('favContainer0', 0);
      closeContainer('favMasonryContainer0', 0);
      structure.oppo = false;
      currentRequest.panelId = 'navListContainer0';
      currentRequest.obj = elementEntry;
      structure.isNav = true;
      if (structure.isRESTRequired('navContainer0', 'navContainer1')) {
        var newRest = Object.create(restObject.prototype);
        newRest.params = {
          param1: "RESPLIST",
          param2: "SLIDEOUT"
        };
        newRest.postRequest();
      }
      elemStopPropogation((event || window.event));
    };
  
    (document.getElementById('SNAV')).onkeydown = function(event) {
      var Mkey;
      if (window.event)
        Mkey = window.event.keyCode;
      else if(event)
        Mkey = event.which;
      
      if (Mkey == 40 || Mkey == 32)
        this.click(); 
    
      elemStopPropogation((event || window.event));
    };
  }

  if (document.getElementById('SFAV')) {
    (document.getElementById('SFAV')).onclick = function(event) {     
      closeContainer('navContainer0', 0);
      structure.oppo = false;
      currentRequest.panelId = 'favListContainer0';
      currentRequest.obj = elementEntry;
      structure.isNav = false;
      if (structure.isRESTRequired('favContainer0', null)) {
        var newRest = Object.create(restObject.prototype);
        newRest.params = {
          param1: "FAVLIST",
          param2: "SLIDEOUT"
        };
        newRest.postRequest();
      }
      elemStopPropogation((event || window.event));
    };
    
    if(document.getElementById('SFAVMASONRY')) 
    (document.getElementById('SFAVMASONRY')).onclick = function(event) {
      var manFav = document.getElementById('manageMasonryFav');
      var srcElem = event.srcElement || event.target;
      if(srcElem != null && manFav != null && (manFav == srcElem || manFav.contains(srcElem)))
        return;    
      closeContainer('navContainer0', 0);
      structure.oppo = false;
      currentRequest.panelId = 'favMasonryListContainer0';
      currentRequest.obj = elementEntry;
      structure.isNav = false;
      if (structure.isRESTRequired('favMasonryContainer0', null)) {
        var newRest = Object.create(restObject.prototype);
        newRest.params = {
          param1: "FAVLIST",
          param2: "SLIDEOUT"
        };
        newRest.postRequest();
      }
      elemStopPropogation((event || window.event));
      event.preventDefault();
    };
  
    (document.getElementById('SFAV')).onkeydown = function(event) {
      var Mkey;
      if (window.event)
        Mkey = window.event.keyCode;
      else if(event)
        Mkey = event.which;
      
      if (Mkey == 40 || Mkey == 32)
        this.click();   
      elemStopPropogation((event || window.event));
    };
  }
}

//Bug#23045263 
//if (window.onload) {
  //window.onload = navfavClickEvent;
//}
//else if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', navfavClickEvent, false);
//}


window.onclick = function(event) {
  closeContainer('favContainer0', 0);
  closeContainer('favMasonryContainer0', 0);
  closeContainer('navContainer0', 0);
  //return false;
};

if ('ontouchstart' in window) {
window.ontouchstart = function(event) {
    var touch = event.targetTouches[0] || event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
    var mouseX = touch.pageX;
    var mouseY = touch.pageY;
    var index = 0;
    try
    {
        index = getContainerIndex(event)+1;
    }
    catch(e) {}
    var temp = document.getElementById('favContainer'+index);
    var source = document.elementFromPoint(mouseX, mouseY);
     
   if(temp != null && source != null && !temp.contains(source)) 
        closeContainer('favContainer'+index, index);
   temp = document.getElementById('navContainer'+index);
   if(temp != null && source != null && !temp.contains(source))
        closeContainer('navContainer'+index, index);
   temp = document.getElementById('favMasonryContainer'+index);
   if(temp != null && source != null && !temp.contains(source))
        closeContainer('favMasonryContainer'+index, index);        
};
}

function elemStopPropogation(event) {
  if (event.stopPropagation)
    event.stopPropagation();
  if (event.cancelBubble)
    event.cancelBubble = true; 
}

function closeContainer(id, index) {
  var temp = document.getElementById(id);
  if (temp != null && temp != undefined)
    temp.style.display = "none"
  index = (index > 0)?(index - 1):0;
  var focusNotSet = true;
  var temp = document.getElementsByClassName('listEntrySelect');
  var i = 0;
  for (i=0; i<temp.length; i++) {
    var contId = (temp[i].parentNode.parentNode).id;
    if (index <= (parseInt(contId.substr(contId.length - 1))))
    {
        if(index == (parseInt(contId.substr(contId.length - 1))) && focusNotSet)
        {
            focusNotSet = false;
            temp[i].focus();
        }
        temp[i].className = 'listEntry';
    }
  }
}

//!---- Code handling overflow and scroll----!
function navScrollList (id, evnt, direction, dRate, tRate, listIndex, resetArrowMethod)
{
    var supList = document.getElementById(id);
    if (listIndex == null || listIndex == undefined) {
      listIndex = 1;
    }
    if (resetArrowMethod == null || resetArrowMethod == undefined) {
      resetArrowMethod = resetArrow;
    }
    var list = supList.children[listIndex];
    var childElem = list.children;
    var lList = childElem.length;
    var divScrCurr = 0;
    var maxScr = 0;
    var stepScr = 0;
    var finLoc = 0;
    var lhiwi = 0;
    var start = 0;
    var end = 0;
    if (direction == "vertical")
    {
        stepScr = childElem[1].offsetTop - childElem[0].offsetTop;
        divScrCurr = list.scrollTop;
        maxScr = elementScrollMaxH(list);
        lhiwi = list.clientHeight;
        end = maxScr;
    }
    else
    {
        stepScr = childElem[1].offsetLeft - childElem[0].offsetLeft;
        if (_agent.isIE && !_isLTR())
            stepScr = -stepScr;
        divScrCurr = list.scrollLeft;
        maxScr = elementScrollMaxW(list);
        lhiwi = list.clientWidth;
        if (!_isLTR() && _agent.isSafari)
            start = maxScr;
        else if (!_isLTR() && _agent.isGecko)
            end = -maxScr;
        else
            end = maxScr;
    }
    if (dRate == null)
        dRate = stepScr*0.1;
    if (tRate == null)
        tRate = 40;
    if (evnt == "up")
    {
        if (Math.abs(divScrCurr - start) > Math.abs(stepScr))
            finLoc = divScrCurr - stepScr;
        else
        {
            finLoc = start;
        }
        dRate = -dRate;
    }
    else if (evnt == "down")
    {
        if (Math.abs(end - divScrCurr) > Math.abs(stepScr))
            finLoc = divScrCurr + stepScr;
        else
            finLoc = end;
    }
    else if (evnt == "home")
    {
        finLoc = start;
        dRate = -dRate;
    }
    else if (evnt == "end")
    {
        finLoc = end;
    }
    var tempFlag = (direction=="vertical")?true:false;
    if (!tempFlag) {
      tempFlag = (_isLTR()||(!_isLTR()&&_agent.isIE));
    }
    if (evnt == "pgUp")
    {
        if (Math.abs(divScrCurr - start) <= Math.abs(lhiwi))
            finLoc = start;
        else
            finLoc = divScrCurr + (tempFlag?-lhiwi:lhiwi);
        dRate = -dRate;
    }
    else if (evnt == "pgDwn")
    {
        if (Math.abs(end - divScrCurr) <= Math.abs(lhiwi))
            finLoc = end;
        else
            finLoc = divScrCurr + (tempFlag?lhiwi:-lhiwi);
    }
    navSmoothScroll (id, direction, finLoc, divScrCurr, dRate, tRate, listIndex, resetArrowMethod);
}

function navSmoothScroll (id, direction, destOff, currOff, rate, trate, listIndex, resetArrowMethod)
{
    var dLi = document.getElementById(id).children[listIndex];
    var y=0;
    var max = 0;
    if (direction == "vertical")
        max = elementScrollMaxH(dLi);
    else
        max = elementScrollMaxW(dLi);
    if (Math.abs(destOff - currOff) > Math.abs(rate))
    {
        if (direction == "vertical")
            dLi.scrollTop = currOff;
        else
            dLi.scrollLeft = currOff;
        resetArrowMethod(id, currOff, max, direction);
        currOff = currOff + rate;
        y = setTimeout(function(){navSmoothScroll(id, direction, destOff, currOff, rate, trate, listIndex, resetArrowMethod)}, trate);
    }
    else
    {
        if (direction == "vertical")
            dLi.scrollTop = destOff;
        else
            dLi.scrollLeft = destOff;
        currOff = destOff;
        resetArrowMethod(id, currOff, max, direction);
        clearTimeout(y);
    }
}

//apzambre
//apzambre
var navScroll = (function () {
  function scroll () {
    this.startX = 0;
    this.startY = 0;
    this.distX = 0;
    this.distY = 0;
    this.touchTime = 0;
    this.dynX = 0;
    this.dynY = 0;
    this.orient = 0;
    this.stepSize = 0;
  }

  scroll.prototype.initializeScrollList = function(element, ornt)
  {
          var that = this;
          if (navigator.userAgent.indexOf("iPad") != -1 || isMobilePhone())
          {
              if (element != null)
              {
                element.addEventListener('touchstart',function(event){that.initDrag(event);});
                element.addEventListener('touchmove',function(event, element){that.scroll(event, this);});
                element.addEventListener('touchend',function(event){that.endDrag(event);});
              }
          }
          else
          {
              var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
              if (document.attachEvent)
                  element.attachEvent("on"+mousewheelevt, function(event){elemPreventDefault(event); that.scroll(event, this);});
              else
                  element.addEventListener(mousewheelevt, function(event){elemPreventDefault(event); that.scroll(event, this);}, false);
          }
          this.orient = ornt;
          if (ornt == "horizontal")
              this.stepSize = Math.abs((element.children[1].offsetLeft - element.children[0].offsetLeft)/3);
          else
              this.stepSize = Math.abs((element.children[1].offsetTop - element.children[0].offsetTop)/3);
      };

      scroll.prototype.initDrag = function(event)
      {
          if (!event)
              event = window.event;
          elemPreventDefault(event);
          this.startY = event.touches[0].pageY;
          this.startX = event.touches[0].pageX;
          this.dynY = this.startY;
          this.dynX = this.startX;
          this.touchTime = new Date().getTime();
          distX = 0;  distY = 0;
      };

      scroll.prototype.scroll = function(event, element)
      {
          var delta = 0;
          if (!event)
              event = window.event;
          if (event.wheelDelta)
              delta = -(event.wheelDelta/120)*(this.stepSize)/10;
          else if (event.detail)
              delta = (event.detail)*(this.stepSize)/10;
          else if (event.touches) {
              if (event.touches.length > 2)
                  return;
              this.distY = this.dynY - event.touches[0].pageY ;
              this.dynY = event.touches[0].pageY;
              this.distX =  this.dynX - event.touches[0].pageX;
              this.dynX = event.touches[0].pageX;
              this.move(element);
          }
          if (delta < 0)
              for (var x=0; x>=-this.stepSize; x=x+delta)
              {
                  this.distY = delta;
                  //this.dynY = event.touches[0].pageY;
                  this.distX = delta;
                  //this.dynX = event.touches[0].pageX;
                  this.move(element);
              }
          else if (delta > 0)
              for (var x=0; x<=this.stepSize; x=x+delta)
              {
                  this.distY = delta;
                  //this.dynY = event.touches[0].pageY;
                  this.distX = delta;
                  //this.dynX = event.touches[0].pageX;
                  this.move(element);
              }
      };

      scroll.prototype.move = function(element)
      {
          if (this.orient == "horizontal" && (element.scrollLeft >= 0) && (element.scrollLeft <= elementScrollMaxW(element)))
          {
          //portrait
              element.scrollLeft = element.scrollLeft + this.distX;
              if (this.hasOwnProperty('callArrowReset'))
                  this.callArrowReset(element.parentElement.id, element.scrollLeft, elementScrollMaxW(element), this.orient)
              else
                  resetArrow(element.parentElement.id, element.scrollLeft, elementScrollMaxW(element), this.orient);
          }
          else if (this.orient == "horizontal" && !_isLTR() && _agent.isGecko && (element.scrollLeft <= 0) && (element.scrollLeft >= -elementScrollMaxW(element)))
          {
          //portrait
              element.scrollLeft = element.scrollLeft + this.distX;
              if (this.hasOwnProperty('callArrowReset'))
                  this.callArrowReset(element.parentElement.id, element.scrollLeft, elementScrollMaxW(element), this.orient)
              else
                  resetArrow(element.parentElement.id, element.scrollLeft, elementScrollMaxW(element), this.orient);
          }
          else if (this.orient == "vertical" && (element.scrollTop >= 0) && (element.scrollTop <= elementScrollMaxH(element)))
          {
          //landscape
              element.scrollTop = element.scrollTop + this.distY;
              if (this.hasOwnProperty('callArrowReset'))
                  this.callArrowReset(element.parentElement.id, element.scrollTop, elementScrollMaxH(element), this.orient);
              else
                  resetArrow(element.parentElement.id, element.scrollTop, elementScrollMaxH(element), this.orient);
          }
      };

      scroll.prototype.endDrag = function(event)
      {
          this.distY = Math.abs(event.changedTouches[0].pageY - this.startY);
          this.distX = Math.abs(event.changedTouches[0].pageX - this.startX);
          var duration = new Date().getTime() - this.touchTime;
          if (this.distY < 10 && this.distX < 10 && duration < 180)
          {
              var element = event.target;
              if (element == null)
                  element = event.srcElement;
              var altEvent;
              var evnt;
              evnt = "click";
              if (document.createEvent) {
                  altEvent = document.createEvent("HTMLEvents");
                  altEvent.initEvent(evnt, true, false);
              } else {
                  altEvent = document.createEventObject();
                  altEvent.eventType = evnt;
              }
              altEvent.eventName = evnt;
              if (document.createEvent) {
                  element.dispatchEvent(altEvent);
              } else {
                  element.fireEvent("on" + evnt, altEvent);
              }
          }
      };
      return scroll;
  }) ();
  
  function getMaximumCharacters(itemDiv) {
      var widthMultiplier = (itemDiv.getAttribute('aria-haspopup') == 'true' && (navigator.userAgent.indexOf("iPad")<0)) ? 1 : 1.7 ;
      var container = itemDiv.firstElementChild.lastElementChild;
      var spacedText = container.textContent;
      if(spacedText != null && spacedText.length > 0)
        spacedText = spacedText.replace(/\s/g,'');
      while(spacedText.length < 200)
        spacedText += spacedText;
      var truncatedText = getTruncatedText(container,spacedText,widthMultiplier);
      return truncatedText.length;
}


function formatWorklistForOAF() {
    
    var worklistTable = document.getElementById('WorklistTable');
    var parent = document.getElementById('SNTF');
    var respMenu = document.getElementById('ResponsiveMenuImg');
    if(respMenu != null && respMenu.style.display != 'none')
    {
        worklistTable = document.getElementById('RespWorklistTable');
        parent = document.getElementById('RespSNTF');
    }
    if(worklistTable == null)
        return;
    worklistTable.style.borderRadius = "0px";
    worklistTable.style.top = "";
    worklistTable.style.marginTop = "0px";
    worklistTable.style.height="";
    if (isBiDi())
    {
        worklistTable.style.left = "20px";
        worklistTable.style.right = "";
    }
    else
    {
        worklistTable.style.left = "";
        worklistTable.style.right = "20px";
    }
    if(worklistTable.children.length == 2 && worklistTable.children[1].className == 'loadingDiv')
    {
        worklistTable.style.height = "500px";
        worklistTable.children[1].style.position = 'relative';
        worklistTable.children[1].style.left = "10px";
        worklistTable.children[1].style.top = "200px";
        worklistTable.style.backgroundColor = "white";
        worklistTable.getElementsByTagName('IMG')[0].style.height = '';
        worklistTable.getElementsByTagName('IMG')[0].style.width = '';
        worklistTable.children[1].children[1].style.padding = "5px";
        worklistTable.children[1].children[1].style.cssFloat = "";
        worklistTable.children[1].children[1].style.styleFloat = "";
        worklistTable.style.opacity='1';
        return;
    }
    worklistTable.children[1].style.borderRadius = "0px";
    worklistTable.children[1].style.backgroundColor = "white";
    worklistTable.children[1].style.borderBottom = "1px solid #0572ce";
    worklistTable.children[1].style.height = "46px";
    worklistTable.lastChild.style.backgroundColor = "white";
    worklistTable.lastChild.style.borderTop = "1px solid #0572ce";
    worklistTable.lastChild.style.borderRadius = "0px";
    worklistTable.lastChild.style.paddngTop = "15px";
    if(parent != null)
        worklistTable.style.top = parent.getBoundingClientRect().height + "px";
}


function isMobilePhone() {
    var Android = navigator.userAgent.match(/Android/i);
    
    var BlackBerry = 
         navigator.userAgent.match(/BlackBerry/i);
    
    var iOS = 
         navigator.userAgent.match(/iPhone|iPod/i);
    
    var Opera = 
         navigator.userAgent.match(/Opera Mini/i);
    
    var Windows =
         navigator.userAgent.match(/IEMobile/i);
    
        return (Android || BlackBerry || iOS || Opera || Windows);
};

function adjustNavigatorPopupSize(contId){
    var container = document.getElementById(contId);
    if(container == null || container.parentElement.style.display == 'none')
        return;
        var winH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        if(isMobilePhone())
            winH = Math.min(document.documentElement.clientHeight, window.innerHeight || 0);
        var topHeight = parseInt(container.previousElementSibling.offsetHeight);
        var bottomHeight = parseInt(container.nextElementSibling.offsetHeight);
        var totalHgt = topHeight + bottomHeight;
        container.style.height = winH - totalHgt - 2 + "px";

        container.childNodes[0].style.setProperty("height", winH - totalHgt - 8 + "px","important");
        if(!isMobilePhone())
            return;
        var winW = Math.min(document.documentElement.clientWidth, window.innerWidth || 0);
        document.getElementById('navSearch').className = 'navSearch navSearchMobile';
        container.parentElement.style.setProperty("width",winW + "px", "important");
        container.previousElementSibling.childNodes[0].style.maxWidth = (winW - 50) + "px";
        container.style.width = winW+ "px";
        container.childNodes[0].style.setProperty("width",winW + "px", "important");
};

function isBiDi()
{
    var html = document.getElementsByTagName("html");
    if (html != null || html.length > 0)
    {
        if (html[0].dir == "rtl")
        {
            return true; // direction tag is rtl
        }
    }
    return false; // return default = ltr
}