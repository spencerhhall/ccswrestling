(function() {
    /**
     * Things to do...
     * 1. Remember what is happening in the main function
     * 2. Comment everything
     * 3. Consider chopping up some of the parsing techniques into smaller methods
     * 4. Develop HTML and CSS for aesthetic display of data
     * 5. To cut down on the length of the "main" method, consider making the
     *      page data a global variable so the smaller methods can access it
     * 6. Go through code and consider making more helper functions
     */

    "use strict";

    // Helpful for optimizing parsing efficiency
    const CCS_URL = "http://www.ccsrank.com/CCSDATA";
    const YEARS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"];
    const SECTIONS = ["SCVAL", "TCAL", "WCAL", "BVAL", "PAL", "SCCAL", "MBL",
        "MTAL", "CENTRAL COAST"
    ];

    // Allows individual functions to parse through the same data
    let wrestlers = []; // Stores all of the finalized wrestler objects
    let lineAndTemp = [];


    window.addEventListener("load", initialize);


    /* ------------------------------ Main Functions ------------------------------ */

    /**
     * Adds functionality to the submit button.
     */
    function initialize() {
        id("submit").addEventListener("click", function() {
            let weightClass = id("weight-class").value;
            if (weightClass != "") {
                retrieveData(weightClass);
            }
        });

        retrieveData(126);
    }


    /**
     * Scrapes the raw HTML of the desired page, uses regex to do some basic 
     * cleaning/structuring, and returns the data.
     * @param {string} weightClass - desired weight class specified by user
     * @returns {string} partially cleaned HTML from the desired page (each line is data
     *      for one wrestler)
     */
    function retrieveData(weightClass) {
        $.getJSON("http://www.whateverorigin.org/get?url=" + encodeURIComponent(CCS_URL + weightClass + ".htm") + "&callback=?", function(data) {
            let pageData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes HTML tags
            pageData = pageData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            pageData = pageData.replace(/[\n\r]+/g, " "); // Removes line breaks
            pageData = pageData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            pageData = pageData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters
            pageData = pageData.split(/  \d |  \d\d |  - /); // Breaks the data into lines about each wrestler

            let parsedData = parseData(pageData);
            populatePage(parsedData);
        });

    }


    /**
     * Creates an Object to represent a wrestler and then parses through the HTML
     * data to add attributes. Ultimately returns the Array of wrestler Objects.
     * *CONSIDERING CHOPPING THIS UP INTO MUCH SMALLER METHODS WITH GLOBAL VARIABLES*
     * @param {string} data - partially cleaned HTML data
     * @returns {Array} holds all wrestler Objects
     */
    function parseData(data) {

        for (let i = 1; i < data.length; i++) { // First line isn't relevant
            //lineAndTemp[0] = data[i];
            //lineAndTemp[1] = line.indexOf(" ");




            let line = data[i];
            let wrestler = new Object();


            // RANK
            wrestler.rank = i;


            // LAST WEEK'S RANK
            let temp = line.indexOf(" "); // Space between last week's rank and name
            // Checks if last week's ranking was in a different weight class
            if (line.substring(temp + 1, temp + 2) == "(") {
                temp += 6;
            }
            wrestler.lwRank = line.substring(0, temp);
            line = line.slice(temp);


            // YEAR
            // temp = -1;       *Not really sure I need this because it's guaranteed to change below*
            YEARS.forEach(function(year) {
                if (line.indexOf(year) != -1) {
                    temp = line.indexOf(year);
                    wrestler.year = year;
                }
            });


            // NAME
            wrestler.name = line.substring(0, temp).trim();
            line = line.slice(temp);
            // Not sure whatexactly this does
            // Initial guess: name comes before year so it slices out the name, temp 
            // moves to the next section (past year), and then we cut out the year
            // Possible change to temp = iOf(" ") first and then just once slice
            temp = line.indexOf(" ");
            line = line.slice(temp).trim();


            // SECTION
            // temp = -1;       *Not really sure I need this because it's guaranteed to change below*
            SECTIONS.forEach(function(section) {
                // Ran into an error where it would use the section of a person they wrestled
                // so I had to restrict the range it checked
                if (line.substring(0, 35).indexOf(section) != -1) {
                    temp = line.indexOf(section);
                    wrestler.section = section;
                }
            });


            // SCHOOL
            wrestler.school = line.substring(0, line.indexOf(wrestler.section)).trim();


            // PREVIOUS RESULTS
            line = line.slice(temp);
            temp = line.indexOf(" ");
            // Not sure what case this is handling
            if (wrestler.section == "CENTRAL COAST") {
                line = line.slice(temp).trim();
                temp = line.indexOf(" ");
            }
            line = line.slice(temp).trim();

            if (line.indexOf("Others") != -1) {
                line = line.slice(0, line.indexOf("Others")).trim();
            }

            if (line.indexOf("LEAGUE") != -1 || line.indexOf("NATIONALS") != -1) {
                let prevResults = []
                if (line.indexOf("LEAGUE") != -1 && line.indexOf("NATIONALS") != -1) {
                    temp = Math.min(line.indexOf("LEAGUE"), line.indexOf("NATIONALS"));
                    let temp2 = Math.max(line.indexOf("LEAGUE"), line.indexOf("NATIONALS"));

                    prevResults.push(line.substring(temp, temp2).trim());
                    prevResults.push(line.substring(temp2).trim());

                    wrestler.prevResults = prevResults;
                    line = line.slice(0, temp2).trim();
                } else if (line.indexOf("LEAGUE") != -1) {
                    temp = line.indexOf("LEAGUE");
                    prevResults.push(line.substring(temp).trim());

                    wrestler.prevResults = prevResults;
                    line = line.slice(0, temp).trim();
                } else if (line.indexOf("NATIONALS") != -1) {
                    temp = line.indexOf("NATIONALS");
                    prevResults.push(line.substring(temp).trim());

                    wrestler.prevResults = prevResults;
                    line = line.slice(0, temp).trim();
                }
            } else {
                wrestler.prevResults = null;
            }


            // RESULTS
            if (line != "") {
                let results = getResults(line);
                if (results == null) {
                    wrestler.results = null;
                } else {
                    line = results.pop();
                    wrestler.results = results;
                }


                // HEAD TO HEAD
                let hh = [];
                if (line != "") {
                    // What in God's name is this regex I cam up with
                    let capture = line.split(/(\d-\d|\d\d-\d\d|\d\d-\d|\d-\d\d|fall|\d:\d\d)/g);
                    for (let i = 0; i < capture.length - 1; i += 2) {
                        let text = capture[i] + capture[i + 1];
                        text = text.trim();
                        hh.push(text);
                    }
                    wrestler.hh = hh;
                } else {
                    wrestler.hh = null;
                }
            }

            wrestlers.push(wrestler);
        }

        console.log(wrestlers);
        return wrestlers;
    }


    /* ------------------------------ Parsing Functions ------------------------------ */

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getRank() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getLastWeeksRank() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getYear() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getName() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getSection() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getSchool() {

    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getPreviousResults() {

    }


    /**
     * Parses through the given line to find if the wrestler has a "Results" section. Creates
     * and Array to store each result and then returns it back to the "main" function.
     * @param {string} line - the remaining section of a wrestler's line
     * @returns {Array} wrestler's results
     */
    function getResults(line) {
        // It will either be a number from 0-10 or Cons.
        if (/\d/g.test(line.substring(0, 1)) || line.substring(0, 5) == "Cons.") {
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

            results.push(line);
            return results;
        } else {
            return null;
        }
    }


    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     */
    function getHeadToHead() {

    }


    /* ------------------------------ Display Function ------------------------------ */

    /**
     * Basically just testing the results of the data retrieving, cleaning, and parsing.
     * NOT THE FINAL DISPLAY METHOD
     * @param {Array} wrestlers - holds finalized wrestler Objects
     */
    function populatePage(wrestlers) {
        wrestlers.forEach(function(wrestler) {
            let div = ce("div");
            div.id = "content-child";
            let p = ce("p");
            p.innerHTML = wrestler.rank + " " + wrestler.lwRank + " " + wrestler.name + " " + wrestler.year + " " + wrestler.school + " " + wrestler.section + " " + wrestler.results + " " + wrestler.hh + " " + wrestler.prevResults;
            div.append(p);
            id("content-area").append(div);
        });
    }


    /* ------------------------------ Helper Functions ------------------------------ */

    /**
     * Returns the element that has the ID attribute with the specified value.
     * *NOTE: *
     * @param {string} id - element ID
     * @returns {object} DOM object associated with id.
     */
    function id(id) {
        return document.getElementById(id);
    }

    /**
     * Creates and returns a DOM object with the specified tag.
     * @param {string} el - tag of the DOM object to create
     * @returns {DOM object} a newly created DOM object with the given tag.
     */
    function ce(el) {
        return document.createElement(el);
    }

})();