(function() {

    /**
     * Things to do...
     * 1. Break main parsing function into smaller methods
     * 2. Develop HTML and CSS for aesthetic display of data
     * 3. Add filters for display
     */

    "use strict";

    // Helpful for optimizing parsing
    const CCS_URL = "http://www.ccsrank.com/CCSDATA";
    const YEARS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"];
    const SECTIONS = ["SCVAL", "TCAL", "WCAL", "BVAL", "PAL", "SCCAL", "MBL",
        "MTAL", "CENTRAL COAST"
    ];

    let lineAndTemp = []; // Allows individual functions to work on same pieces of data

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

        // No idea why wrapping my function in another function works, but this is the only
        // way I've been able to make it work
        id("filter-year").addEventListener("change", function() {
            filter(this.value);
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
        killTheChildren();
        $.getJSON("http://www.whateverorigin.org/get?url=" + encodeURIComponent(CCS_URL + weightClass + ".htm") + "&callback=?", function(data) {
            let pageData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes HTML tags
            pageData = pageData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            pageData = pageData.replace(/[\n\r]+/g, " "); // Removes line breaks
            pageData = pageData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            pageData = pageData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters
            pageData = pageData.split(/  \d |  \d\d |  - /); // Breaks the data into lines about each wrestler

            handleData(pageData);
        });
    }


    /**
     * Scrapes the raw HTML of the desired page, uses regex to do some basic 
     * cleaning/structuring, and returns the data.
     * @param {string} weightClass - desired weight class specified by user
     * @returns {string} partially cleaned HTML from the desired page (each line is data
     *      for one wrestler)
     */
    function handleData(data) {
        let parsedData = parseData(data);
        populatePage(parsedData);
    }


    /**
     * Creates an Object to represent a wrestler and then parses through the HTML
     * data to add attributes. Ultimately returns the Array of wrestler Objects.
     * *CONSIDERING CHOPPING THIS UP INTO MUCH SMALLER METHODS WITH GLOBAL VARIABLES*
     * @param {string} data - partially cleaned HTML data
     * @returns {Array} holds all wrestler Objects
     */
    function parseData(data) {
        let wrestlers = [];
        for (let i = 1; i < data.length; i++) { // First line isn't relevant
            // lineAndTemp[0] = data[i];
            // lineAndTemp[1] = line.indexOf(" ");




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

    // I should probably add some sort of main function for this to handle different filters

    /**
     * Basically just testing the results of the data retrieving, cleaning, and parsing.
     * NOT THE FINAL DISPLAY METHOD
     * @param {Array} wrestlers - holds finalized wrestler Objects
     */
    function populatePage(wrestlers) {
        let wrestlerCount = wrestlers.length;
        id("child-count").innerHTML = "Currently displaying " + wrestlerCount + " wrestlers.";
        console.log(wrestlerCount);

        wrestlers.forEach(function(wrestler) {
            let div = ce("div");
            div.classList.add("content-child");
            // Can filter by: year and section (for now)
            div.id = wrestler.year.toLowerCase(); + "-" + wrestler.section.toLowerCase();
            let p = ce("p");
            p.innerHTML = wrestler.rank + " " + wrestler.lwRank + " " + wrestler.name + " " + wrestler.year + " " + wrestler.school + " " + wrestler.section + " " + wrestler.results + " " + wrestler.hh + " " + wrestler.prevResults;
            div.append(p);
            id("content-area").append(div);
        });
    }

    function filter(filter) {
        id("filter-test").innerHTML = filter;

        // Filtering by year for now
        // "", freshman, sophomore, junior, senior
        if(filter === "") {

        } else {
            let currentBlocks = qsa(".content-child");
            currentBlocks.forEach(function(block) {
                let blockID = block.id;
                if(!blockID.includes("filter")) {
                    id(blockID).classList.add("hidden");
                } else {
                    id(blockID).classList.remove("hidden");
                }
            });
        }
    }

    function countDisplay() {
        let totalBlocks = qsa(".content-child");
        let trueDisplay = 0;
    }


    /* ------------------------------ Helper Functions ------------------------------ */

    /**
     * Returns the element that has the ID attribute with the specified value.
     * *NOTE: DO NOT NAME THIS '$' BECAUSE IT INTERFERES WITH JQUERY*
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

    /**
     * Returns the array of elements that match the given CSS selector.
     * @param {string} query - CSS query selector
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qsa(query) {
        return document.querySelectorAll(query);
    }

    /**
     * Toggles the class of an element specified by its id.
     * @param {string} id - element ID
     * @param {string} cl - class to be added or removed
     */
    function toggle(id, cl) {
        if ($(id).classList.contains(cl)) {
            $(id).classList.remove(cl);
        } else {
            $(id).classList.add(cl);
        }
    }

    /**
     * Kills all of the child elements of the content-container div.
     */
    function killTheChildren() {
        let contentChildren = qsa(".content-child");
        contentChildren.forEach(function(child) {
            child.remove();
        });
    }

})();