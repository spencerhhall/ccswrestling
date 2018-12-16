(function() {

    "use strict";

    // Constants for parsing through an individual wrestler's data
    const YEARS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"];
    const SECTIONS = ["SCVAL", "TCAL", "WCAL", "BVAL", "PAL", "SCCAL", "MBL", "MTAL", "CENTRAL COAST"];

    // Array to hold the finished wrestler objects
    let wrestlers = [];

    window.addEventListener("load", initialize);


    function initialize() {
        sendRequest(113);
    }


    function sendRequest(weightClass) {
        let athleteData = [];

        $.getJSON('http://www.whateverorigin.org/get?url=' + encodeURIComponent('http://www.ccsrank.com/CCSDATA' + weightClass + '.htm') + '&callback=?', function(data) {
            let athleteData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes html tags
            athleteData = athleteData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            athleteData = athleteData.replace(/[\n\r]+/g, " "); // Removes line breaks
            athleteData = athleteData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            athleteData = athleteData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters
            athleteData = athleteData.split(/  \d |  \d\d |  - /); // Breaks the data into lines about each wrestler

            let parsedData = parseData(athleteData);
            // Order of data in athletes' lines (r- always present, n- not always)
            // last week's rank (r) | name (r) | year (r) | school (r) | section (r) | 18-19 results (n) | head-head (n) | previous results (n)
            // r | r | r | r | r | n | n | n
            // Ways to identify
            // last week's rank: first character or two in the string
            // name: 2-3 tokens
            // year: all caps, only 4 options
            // school: limited options, 1-4 tokens
            // section: 7 options, 1 token
            // These last few are tricky because they may not even exist
            // 18-19 results: starts with number of "Cons."
            // head-head: 2-4 characters to start (all caps)
            // previous results: all caps with limited options




        });

    }

    function parseData(data) {
        for (let i = 1; i < data.length; i++) {
            let line = data[i];
            let wrestler = new Object();


            // RANK
            wrestler.rank = i;


            // LAST RANK
            let temp = line.indexOf(" "); // the space between the lwrank and name
            // Checks for lw ranking of alternate weight class
            if (line.substring(temp + 1, temp + 2) == "(") {
                temp += 6;
            }

            wrestler.lwrank = line.substring(0, temp);
            line = line.slice(temp);


            // YEAR
            temp = -1;
            YEARS.forEach(function(year) {
                if (line.indexOf(year) != -1) {
                    temp = line.indexOf(year);
                    wrestler.year = year;
                }
            });


            // NAME
            wrestler.name = line.substring(0, temp).trim();

            line = line.slice(temp);
            temp = line.indexOf(" ");
            line = line.slice(temp).trim();


            // SECTION
            temp = -1;
            SECTIONS.forEach(function(section) {
                if (line.substring(0, 35).indexOf(section) != -1) {
                    temp = line.indexOf(section);
                    wrestler.section = section;
                }
            });


            // SCHOOL
            wrestler.school = line.substring(0, line.indexOf(wrestler.section)).trim();


            line = line.slice(temp);
            temp = line.indexOf(" ");
            if (wrestler.section == "CENTRAL COAST") {
                line = line.slice(temp).trim();
                temp = line.indexOf(" ");
            }
            line = line.slice(temp).trim();


            // LAST 3
            //console.log(wrestler.rank + " has left:" + line);

            if (line.indexOf(" ") == -1) {
                wrestler.results = null;
                wrestler.hh = null;
                wrestler.prevresults = null;
            } else {

                let results = parseResults(line);
                let hh = parseHeadHead(results[-1]);


                if (results.length == 1) {
                    wrestler.results = null;
                } else {
                    results.pop();
                    wrestler.results = null;
                }




            }


            wrestlers.push(wrestler);
        }

        console.log(wrestlers);
    }




    function parseResults(line) {
        // It will either be a number from 0-10 or Cons.
        if (/\d/g.test(line.substring(0, 1)) || line.substring(0, 5) == "Cons.") { // Placed in something
            let results = [];
            while (/\d/g.test(line.substring(0, 1)) || line.substring(0, 5) == "Cons.") {
                let temp = line.indexOf(")");
                let result = line.substring(0, temp + 1);
                results.push(result);
                line = line.slice(temp + 1).trim();
            }

            results.push(line);
            return results;
        } else {
            return null;
        }
    }


    function parseHeadHead(line) {
        return null;
    }


    function parsePrevResults(line) {
        return null;
    }




})();