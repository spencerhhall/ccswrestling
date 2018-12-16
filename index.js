(function() {
    /* Need to...
     *
     */

    const YEARS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"];
    const SECTIONS = ["SCVAL", "TCAL", "WCAL", "BVAL", "PAL", "SCCAL", "MBL", "MTAL"];
    const SCHOOLS = ["Alisal", "Edward Alvarez", "Andrew Hill", "Aptos", "Aragon",
        "Archbishop Mitty", "Archbishop Riordan", "Bellarmine Prep", "Branham",
        "Burlingame", "Capuchino", "Carmel", "Cupertino", "Del Mar", "El Camino",
        "Evergreen Valley", "Fremont", "Gilroy", "Gonzales", "Greenfield", "Gunderson",
        "Gunn", "Half Moon Bay", "Harbor", "Harker", "Hillsdale", "Homestead", "Independence",
        "James Lick", "King City", "The King’s Academy", "Leigh", "Leland", "Lincoln",
        "Live Oak", "Los Altos", "Los Gatos", "Lynbrook", "Menlo-Atherton", "Mills",
        "Milpitas", "Monta Vista", "Monterey", "Mt. Pleasant", "North Monterey Cty.",
        "North Salinas", "Oak Grove", "Oceana", "Overfelt", "Pacific Grove", "Pajaro Valley",
        "Palma", "Palo Alto", "Piedmont Hills", "Pioneer", "Prospect", "Sacred Heart Cathedral",
        "Salinas", "San Benito", "San Jose Academy", "San Lorenzo Valley", "San Mateo",
        "Santa Clara", "Santa Cruz", "Santa Teresa", "Saratoga", "Scotts Valley", "Seaside",
        "Sequoia", "Junipero Serra", "Silver Creek", "Ann Sobrato", "Soledad", "Soquel",
        "South San Francisco", "St. Francis", "Terra Nova", "Valley Christian", "Watsonville",
        "Westmont", "Wilcox", "Willow Glen", "Woodside", "Yerba Buena", ""
    ];


    let wrestlers = [];


    "use strict";


    window.addEventListener("load", initialize);


    function initialize() {
        let lines = [];

        $.getJSON('http://www.whateverorigin.org/get?url=' + encodeURIComponent('http://www.ccsrank.com/CCSDATA113.htm') + '&callback=?', function(data) {
            let athleteData = $(data.contents).text().replace(/(<([^>]+)>)/ig, ""); // Removes html tags
            athleteData = athleteData.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trims whitespace
            athleteData = athleteData.replace(/[\n\r]+/g, " "); // Removes line breaks
            athleteData = athleteData.replace(/\s{2,10}/g, " "); // Removes more than 2 spaces
            athleteData = athleteData.replace(/[^\x00-\x7F]/g, ""); // Removes special characters


            // Breaks the data into lines about each wrestler
            athleteData = athleteData.split(/  \d |  \d\d |  - /);


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





            for(let i = 1; i < athleteData.length; i++) {
              
              let line = athleteData[i];
              let wrestler = new Object();



              wrestler.rank = i;



              let temp = line.indexOf(" "); // the space between the lwrank and name
              // Checks for lw ranking of alternate weight class
              console.log(line.substring(temp, temp + 2));
              if(line.substring(temp + 1, temp + 2) == "(") {
                console.log("true");
                temp += 6;
              }



              wrestler.lwrank = line.substring(0, temp);
              line = line.slice(temp);



              temp = -1;
              YEARS.forEach(function(year) {
                if(line.indexOf(year) != -1) {
                  temp = line.indexOf(year);
                  wrestler.year = year;
                }
              });


            
              wrestler.name = line.substring(0, temp).trim();



              line = line.slice(temp);
              temp = line.indexOf(" ");
              line = line.slice(temp).trim();







              //wrestler.school = ;
              //wrestler.section = ;

              temp = -1;
              SECTIONS.forEach(function(section) {
                if(line.indexOf(section) != -1) {
                  temp = line.indexOf(section);
                  wrestler.section = section;
                }
              });

              console.log("temp: " + temp);
              wrestler.school = line.substring(0, line.indexOf(wrestler.section)).trim();






              line = line.slice(temp);
              temp = line.indexOf(" ");
              line = line.slice(temp).trim();


              wrestlers.push(wrestler);
            }


            console.log(athleteData);
            console.log(wrestlers);
        });

    }


})();