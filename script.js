// ---------------------------
// Constants and Initial Data
// ---------------------------
const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Drivers!A1:AA45";

const scoringSystem = {
  "1st": 40, "2nd": 35, "3rd": 34, "4th": 33, "5th": 32,
  "6th": 31, "7th": 30, "8th": 29, "9th": 28, "10th": 27,
  "11th": 26, "12th": 25, "13th": 24, "14th": 23, "15th": 22,
  "16th": 21, "17th": 20, "18th": 19, "19th": 18, "20th": 17,
  "21st": 16, "22nd": 15, "23rd": 14, "24th": 13, "25th": 12,
  "26th": 11, "27th": 10, "28th": 9, "29th": 8, "30th": 7,
  "31st": 6, "32nd": 5, "33rd": 4, "34th": 3, "35th": 2,
  "36th": 1, "37th": 1, "38th": 1, "39th": 1, "40th": 1,
  "Fastest Lap": 1, "Stage 1 Winner": 10, "Stage 2 Winner": 10, "Pole Winner": 5
};

let standingsData = {
  weeks: [],
  teams: {
    Midge: { drivers: ["Denny Hamlin", "William Byron", "Ricky Stenhouse Jr.", "Ryan Preece", "Shane van Gisbergen"] },
    Emilia: { drivers: ["Austin Cindric", "Austin Dillon", "Kyle Larson", "AJ Allmendiner", "Alex Bowman"] },
    Heather: { drivers: ["Kyle Busch", "Chase Elliott", "Erik Jones", "Tyler Reddick", "Michael McDowell"] },
    Dan: { drivers: ["Brad Keselowski", "Chris Buescher", "Noah Gragson", "Joey Logano", "Cole Custer"] },
    Grace: { drivers: ["Ross Chastain", "Chase Briscoe", "Josh Berry", "Bubba Wallace", "Daniel Suarez"] },
    Edmund: { drivers: ["Ryan Blaney", "Christopher Bell", "Riley Herbst", "Ty Gibbs", "Carson Hocevar"] }
  }
};

let isDataLoaded = false;

// ---------------------------
// Data Loading Functions
// ---------------------------
document.addEventListener("DOMContentLoaded", function () {
    fetchDataFromGoogleSheets();
});

function fetchDataFromGoogleSheets() {
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        console.log("Fetched data:", data);
        initializeApp(data);
    })
    .catch(error => console.error("Error fetching data:", error));
}

function processRaceData(data) {
  const headerRow = data[0];
  const positions = data.slice(1);
  
  standingsData.weeks = [];

  headerRow.slice(1).forEach((track, trackIndex) => {
    if (!track) return;

    let raceResults = {
      track: track.trim(),
      week: trackIndex + 1,
      standings: {}
    };

    Object.entries(standingsData.teams).forEach(([teamName, team]) => {
      let teamPoints = 0;
      let driverPoints = {};

      team.drivers.forEach(driver => {
        let points = 0;
        positions.forEach((row) => {
          if (row[trackIndex + 1] === driver) {
            const category = row[0];
            points += scoringSystem[category] || 0;
          }
        });
        driverPoints[driver] = points;
        teamPoints += points;
      });

      raceResults.standings[teamName] = {
        total: teamPoints,
        drivers: driverPoints
      };
    });

    standingsData.weeks.push(raceResults);
  });
  console.log("Processed Race Data (Weeks):", standingsData.weeks);
}

// ---------------------------
// UI Population Functions
// ---------------------------
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) return;
  weekSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Week";
  weekSelect.appendChild(defaultOption);

  let lastValidWeekIndex = 0;
  standingsData.weeks.forEach((week, index) => {
    if (week.track && week.track.trim() !== "") {
      const hasNonZeroData = Object.values(week.standings).some(
        (teamData) => teamData.total > 0
      );
      if (hasNonZeroData) {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = `Week ${index + 1}: ${week.track}`;
        weekSelect.appendChild(option);
        lastValidWeekIndex = index + 1;
      }
    }
  });
  weekSelect.value = lastValidWeekIndex;
  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });
}

function generateWeeklyRecap() {
  const recapContainer = document.getElementById("race-recap");
  if (!recapContainer) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find(week => week.week === selectedWeek);
  if (!weekData) {
    recapContainer.innerHTML = "<p>No data available for this week.</p>";
    return;
  }

  const sortedTeams = Object.entries(weekData.standings).sort((a, b) => b[1].total - a[1].total);
  const winningTeamName = sortedTeams[0][0];
  const winningTeamPoints = sortedTeams[0][1].total;
  const lastPlaceTeamName = sortedTeams[sortedTeams.length - 1][0];
  const lastPlaceTeamPoints = sortedTeams[sortedTeams.length - 1][1].total;

  let recapHTML = `<h2>Race Recap: ${weekData.track}</h2>
    <h3>Winning Team: ${winningTeamName} - ${winningTeamPoints} points</h3>`;

  let topDriverNames = [];
  standingsData.teams[winningTeamName].drivers.forEach(driver => {
    // Assuming `driverPoints` is where individual driver scores are stored
    const driverScore = weekData.standings[winningTeamName].drivers[driver];
    if (driverScore > 30) {
      topDriverNames.push(`${driver} with ${driverScore} points`);
    }
  });

  recapHTML += `<h4>Top Performers:</h4>
    <p>${topDriverNames.length > 0 ? topDriverNames.join('<br>') : "No drivers scored over 30 points on the winning team."}</p>`;

  recapHTML += `<h3>Last Place Team: ${lastPlaceTeamName} - ${lastPlaceTeamPoints} points</h3>`;

  let worstDriverNames = [];
  standingsData.teams[lastPlaceTeamName].drivers.forEach(driver => {
    const driverScore = weekData.standings[lastPlaceTeamName].drivers[driver];
    if (driverScore < 6) {
      worstDriverNames.push(`${driver} with ${driverScore} points`);
    }
  });

  recapHTML += `<h4>Worst Performers:</h4>
    <p>${worstDriverNames.length > 0 ? worstDriverNames.join('<br>') : "No drivers had a bad week (under 6 points) on the last place team."}</p>`;

  const previousStandings = getPreviousWeekStandings(selectedWeek);
  const currentOverallStandings = getOverallStandings();
  const movement = detectStandingsMovement(previousStandings, currentOverallStandings);
  recapHTML += `<h4>Overall Standings Movement:</h4>
    <p>${movement.join('<br>')}</p>`;

  recapContainer.innerHTML = recapHTML;
}

// Add closing brackets for incomplete functions in the `generateWeeklyRecap()`
// and ensure all functions are properly terminated.
// ---------------------------
// Helper Functions
// ---------------------------
function getPreviousWeekStandings(selectedWeek) {
  // Find the previous week's standings data.
  if (selectedWeek === 1) {
    return []; // No previous week for the first week.
  }

  return standingsData.weeks[selectedWeek - 2].standings;
}

function getOverallStandings() {
  // Calculate the overall standings based on total points for all weeks.
  let overallStandings = {};

  standingsData.weeks.forEach(week => {
    Object.entries(week.standings).forEach(([teamName, teamData]) => {
      if (!overallStandings[teamName]) {
        overallStandings[teamName] = { total: 0, weeks: [] };
      }

      overallStandings[teamName].total += teamData.total;
      overallStandings[teamName].weeks.push(teamData.total);
    });
  });

  return overallStandings;
}

function detectStandingsMovement(previousStandings, currentOverallStandings) {
  // Detect standings movement from the previous week to the current.
  let movement = [];

  Object.entries(currentOverallStandings).forEach(([teamName, currentData]) => {
    const prevData = previousStandings[teamName] || { total: 0 };
    const rankMovement = calculateMovement(prevData.total, currentData.total);

    if (rankMovement !== 0) {
      movement.push(`${teamName} moved ${rankMovement} positions`);
    }
  });

  return movement;
}

function calculateMovement(previousPoints, currentPoints) {
  // Calculate the movement of a team between two weeks.
  const previousRank = standingsData.weeks
    .map(week => Object.entries(week.standings))
    .flat()
    .sort((a, b) => b[1].total - a[1].total)
    .findIndex(([team]) => team === previousPoints);

  const currentRank = standingsData.weeks
    .map(week => Object.entries(week.standings))
    .flat()
    .sort((a, b) => b[1].total - a[1].total)
    .findIndex(([team]) => team === currentPoints);

  return currentRank - previousRank;
}

// ---------------------------
// UI Update Functions
// ---------------------------

function loadWeeklyStandings() {
  const standingsTable = document.getElementById("standings-table");
  if (!standingsTable) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find(week => week.week === selectedWeek);

  if (!weekData) {
    standingsTable.innerHTML = "<p>No standings available for this week.</p>";
    return;
  }

  let tableHTML = "<thead><tr><th>Team</th><th>Total Points</th><th>Drivers</th></tr></thead><tbody>";

  Object.entries(weekData.standings).forEach(([teamName, teamData]) => {
    tableHTML += `<tr>
                    <td>${teamName}</td>
                    <td>${teamData.total}</td>
                    <td>${generateDriverPointsHTML(teamData.drivers)}</td>
                  </tr>`;
  });

  tableHTML += "</tbody>";

  standingsTable.innerHTML = tableHTML;
}

function generateDriverPointsHTML(driverPoints) {
  return Object.entries(driverPoints)
    .map(([driver, points]) => `${driver}: ${points}`)
    .join("<br>");
}

// ---------------------------
// Initialization Functions
// ---------------------------

function initializeApp(data) {
  // Extract the race data from the fetched Google Sheets data
  const raceData = data.values.slice(1);
  processRaceData(raceData);

  // Populate the week dropdown and update UI
  populateWeekDropdown();

  // Initial call to display data for the first available week
  loadWeeklyStandings();
  generateWeeklyRecap();

  // Mark the data as loaded so other UI functions can execute
  isDataLoaded = true;
}


