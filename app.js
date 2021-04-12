
// console.log('Hey! Script is working just fine');
// alert('Giving you an alert');

// var username = prompt("What's you name");
// alert('Hi bro - ' + username);


var input = document.querySelector('#input');
var minButtonClicked = document.querySelector("#minBtn");
var yodButtonClicked = document.querySelector("#yodBtn");
var pirButtonClicked = document.querySelector("#pirBtn");

var out = document.querySelector('#outputArea');

// var url = "https://lessonfourapi.tanaypratap.repl.co/translate/yoda.json";
var PirateUrl = "https://api.funtranslations.com/translate/pirate.json";
var YodaUrl ="https://api.funtranslations.com/translate/yoda.json";
var MinionUrl ="https://api.funtranslations.com/translate/minion.json";

var text = "?text=";

minButtonClicked.addEventListener("click", function clickEventHandler() {
   
    var finalUrl =  MinionUrl + text + input.value;
    console.log(finalUrl);

    fetch(finalUrl)
        .then( response => response.json())
        .then( json => printOutput(json.contents.translated))
        .catch( error => console.log("It's an error" + error))

    function printOutput(res){
        out.innerText = res;
    } 
});

yodButtonClicked.addEventListener("click", function clickEventHandler() {
   
    var finalUrl =  YodaUrl + text + input.value;
    console.log(finalUrl);

    fetch(finalUrl)
        .then( response => response.json())
        .then( json => printOutput(json.contents.translated))
        .catch( error => console.log("It's an error" + error))

    function printOutput(res){
        out.innerText = res;
    } 
});

pirButtonClicked.addEventListener("click", function clickEventHandler() {
   
    var finalUrl =  PirateUrl + text + input.value;
    console.log(finalUrl);

    fetch(finalUrl)
        .then( response => response.json())
        .then( json => printOutput(json.contents.translated))
        .catch( error => console.log("It's an error" + error))

    function printOutput(res){
        out.innerText = res;
    } 
});