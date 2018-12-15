(function() {
    /* Need to...
     *
     */


    "use strict";


    window.addEventListener("load", initialize);


    function initialize() {
        let lines = [];

        $.getJSON('http://www.whateverorigin.org/get?url=' + encodeURIComponent('http://www.ccsrank.com/CCSDATA113.htm') + '&callback=?', function(data) {
            console.log(data);
            let goodData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes html tags
            goodData = goodData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            goodData = goodData.replace(/[\n\r]+/g, " "); // Removes line breaks
            goodData = goodData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            goodData = goodData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters
            // Breaks the data into lines about each wrestler
            lines = goodData.split(/ \d \d | - - | - \d | \d - | \d\d \d\d | \d \d\d | \d\d \d | - \d\d | \d\d - /);
            console.log(lines);
        });
  
    }


})();