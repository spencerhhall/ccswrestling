(function() {

    "use strict";

    // Constants for parsing through an individual wrestler's data
    const YEARS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"];
    const SECTIONS = ["SCVAL", "TCAL", "WCAL", "BVAL", "PAL", "SCCAL", "MBL", "MTAL", "CENTRAL COAST"];

    // Array to hold the finished wrestler objects
    let wrestlers = [];

    window.addEventListener("load", initialize);


    function initialize() {
        sendRequest(126);
    }


    function sendRequest(weightClass) {
        let athleteData = [];

        $.getJSON("http://www.whateverorigin.org/get?url=" + encodeURIComponent("http://www.ccsrank.com/CCSDATA" + weightClass + ".htm") + "&callback=?", function(data) {
            let athleteData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes html tags
            athleteData = athleteData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            athleteData = athleteData.replace(/[\n\r]+/g, " "); // Removes line breaks
            athleteData = athleteData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            athleteData = athleteData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters
            athleteData = athleteData.split(/  \d |  \d\d |  - /); // Breaks the data into lines about each wrestler

            let parsedData = parseData(athleteData);
            populatePage(parsedData);
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


            if (line.indexOf("Others") != -1) {
                line = line.slice(0, line.indexOf("Others")).trim();
            }


            if (line.indexOf("LEAGUE") != -1 || line.indexOf("NATIONALS") != -1) {
                let prevresults = []
                if (line.indexOf("LEAGUE") != -1 && line.indexOf("NATIONALS") != -1) {
                    temp = Math.min(line.indexOf("LEAGUE"), line.indexOf("NATIONALS"));
                    let temp2 = Math.max(line.indexOf("LEAGUE"), line.indexOf("NATIONALS"));

                    prevresults.push(line.substring(temp, temp2).trim());
                    prevresults.push(line.substring(temp2).trim());

                    wrestler.prevresults = prevresults;
                    line = line.slice(0, temp2).trim();
                } else if (line.indexOf("LEAGUE") != -1) {
                    temp = line.indexOf("LEAGUE");
                    prevresults.push(line.substring(temp).trim());

                    wrestler.prevresults = prevresults;
                    line = line.slice(0, temp).trim();
                } else if (line.indexOf("NATIONALS") != -1) {
                    temp = line.indexOf("NATIONALS");
                    prevresults.push(line.substring(temp).trim());

                    wrestler.prevresults = prevresults;
                    line = line.slice(0, temp).trim();
                }
            } else {
                wrestler.prevresults = null;
            }

            //console.log(line);



            if (line != "") {
                let results = parseResults(line);

                if (results == null) {
                    wrestler.results = null;
                } else {
                    line = results.pop();
                    wrestler.results = results;
                }




                let capture = line.split(/(\d-\d|\d\d-\d\d|\d\d-\d|\d-\d\d|fall|\d:\d\d)/g);



            }




            wrestlers.push(wrestler);
        }

        console.log(wrestlers);
        return wrestlers;
    }




    function parseResults(line) {
        // It will either be a number from 0-10 or Cons.
        if (/\d/g.test(line.substring(0, 1)) || line.substring(0, 5) == "Cons.") { // Placed in something

            let results = [];

            while (/\d/g.test(line.substring(0, 1)) || line.substring(0, 5) == "Cons.") {

                let temp = line.indexOf(")");

                if (line.indexOf("RULE") != -1) {
                    temp = line.indexOf("RULE") + 3;
                } else if (line.indexOf("I-D") != -1 && line.indexOf("I-D") < 40) {
                    temp = line.indexOf("I-D") + 2;
                }

                let result = line.substring(0, temp + 1);

                results.push(result);
                line = line.slice(temp + 1).trim();

            }

            if (line != "") {
                results.push(line);
            }


            return results;
        } else {
            return null;
        }
    }




    /*function parseHeadHead(line) {
        // It will not star with League or Nationals

        if (line.substring(0, 6) != "LEAGUE" && line.substring(0, 6) != "NATION") { // Placed in something
            let hh = [];


            //while (line.substring(0, 3) != "LEA" && line.substring(0, 3) != "NAT" && line.substring(0, 3) != "Oth" && line.length > 5) {
                let temp = line.indexOf(")");



                let realTemp = temp;
                let tempLine = line.slice(temp + 2);

                temp = tempLine.indexOf(" ");
                realTemp += temp;

                hh.push(line.substring(0, realTemp + 2).trim());
                console.log(line.substring(0, realTemp + 2).trim());
                line = line.slice(realTemp + 2).trim();




            //}

            return hh;
        } else {
            return null;
        }
    }*/




    function populatePage(wrestlers) {
        wrestlers.forEach(function(wrestler) {
            let div = document.createElement("div");
            div.innerHTML = wrestler.rank + " " + wrestler.lwrank + " " + wrestler.name + " " + wrestler.year + " " + wrestler.school;
            document.getElementById("content").append(div);
        });
    }


})();