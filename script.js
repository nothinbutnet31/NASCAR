const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Sheet1!A1:AA45"; // Adjusted range for new format

let standingsData = {
  weeks: [],
  teams: {
    Midge: {
      drivers: ["Denny Hamlin","William Byron","Ricky Stenhouse Jr.", "Ryan Preece", "Shane van Gisbergen"
            ]
    },
    Emilia: { 
      drivers:["Austin Cindric", "Austin Dillon", "Kyle Larson", "AJ Allmendiner", "Alex Bowman"]
    },
    Heather: { 
      drivers:["Kyle Busch", "Chase Elliott", "Erik Jones", "Tyler Reddick", "Michael McDowell"]
    },
    Dan: {
      drivers:["Brad Keselowski", "Chris Buescher", "Noah Gragson", "Joey Logano", "Cole Custer"]
    },
    Grace:{
      drivers:["Ross Chastain", "Chase Briscoe", "Josh Berry", "Bubba Wallace", "Daniel Suarez"]
    },
    Edmund:{
      drivers:["Ryan Blaney", "Christopher Bell", "Riley Herbst", "Ty Gibbs", "Carson Hocevar"]
    },
    
  }
};

let isDataLoaded = false;

// Scoring system
const scoringSystem = {
  "1st": 40,
  "2nd": 35,
  "3rd": 34,
  "4th": 33,
  "5th": 32,
  "6th": 31,
  "7th": 30,
  "8th": 29,
  "9th": 28,
  "10th": 27,
  "11th": 26,
  "12th": 25,
  "13th": 24,
  "14th": 23,
  "15th": 22,
  "16th": 21,
  "17th": 20,
  "18th": 19,
  "19th": 18,
  "20th": 17,
  "21st": 16,
  "22nd": 15,
  "23rd": 14,
  "24th": 13,
  "25th": 12,
  "26th": 11,
  "27th": 10,
  "28th": 9,
  "29th": 8,
  "30th": 7,
  "31st": 6,
  "32nd": 5,
  "33rd": 4,
  "34th": 3,
  "35th": 2,
  "36th": 1,
  "37th": 1,
  "38th": 1,
  "39th": 1,
  "40th": 1,
  "Fastest Lap": 1,
  "Stage 1 Winner": 10,
  "Stage 2 Winner": 10,
  "Pole Winner": 5
};

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    const response = await fetch(driversUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }

    const data = await response.json();
    await processRaceData(data.values);
    isDataLoaded = true;
    init();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Process race data
function processRaceData(data) {
  const headerRow = data[0]; // First row contains track names
  const positions = data.slice(1); // Remaining rows contain positions and special categories

  // Process each race (column)
  headerRow.slice(1).forEach((track, trackIndex) => {
    let raceResults = {
      track: track,
      week: trackIndex + 1,
      standings: {}
    };

    // Calculate points for each team
    Object.entries(standingsData.teams).forEach(([teamName, team]) => {
      let teamPoints = 0;
      let driverPoints = {};

      // Calculate points for each driver in the team
      team.drivers.forEach(driver => {
        let points = 0;

        // Check each position/category for the driver
        positions.forEach((row, rowIndex) => {
          if (row[trackIndex + 1] === driver) {
            const category = row[0]; // Position or special category
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
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  // Calculate total points for each team
  standingsData.weeks.forEach((week) => {
    Object.entries(week.standings).forEach(([team, data]) => {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    });
  });

  // Sort teams by points
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : "";
    row.innerHTML = `
      <td>${trophy}${team}</td>
      <td>${points}</td>
    `;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks[selectedWeek - 1];
  
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  if (weekData) {
    // Sort teams by points for this week
    const sortedTeams = Object.entries(weekData.standings)
      .sort((a, b) => b[1].total - a[1].total);

    sortedTeams.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      const flag = index === 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${data.total}</td>
      `;
      weeklyTable.appendChild(row);
    });
  }
}

// Generate Weekly Recap
function generateWeeklyRecap() {
  const recapContainer = document.getElementById("weekly-recap");
  if (!recapContainer) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks[selectedWeek - 1];

  if (!weekData) {
    recapContainer.innerHTML = "<p>No data available for this week.</p>";
    return;
  }

  let recapText = `<h3>Race Recap: ${weekData.track}</h3>`;

  // Weekly Overview
  const weeklyPoints = Object.values(weekData.standings).map(data => data.total);
  const avgPoints = weeklyPoints.reduce((a, b) => a + b, 0) / weeklyPoints.length;

  recapText += `
    <div class="recap-section">
      <h4>📊 Weekly Overview</h4>
      <ul>
        <li>Average Team Score: ${avgPoints.toFixed(1)} points</li>
        <li>Teams Above Average: ${weeklyPoints.filter(p => p > avgPoints).length}</li>
        <li>Point Spread: ${Math.max(...weeklyPoints) - Math.min(...weeklyPoints)} points</li>
      </ul>
    </div>
  `;

  // Top Performers
  const sortedTeams = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total);
  
  const [winningTeam, winningData] = sortedTeams[0];
  recapText += `
    <div class="recap-section">
      <h4>🏆 Top Performers</h4>
      <p><strong>${winningTeam}</strong> won the week with ${winningData.total} points!</p>
    `;

  // Add top scoring drivers
  const allDriversScores = [];
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      allDriversScores.push({ team, driver, points });
    });
  });

  const topDrivers = allDriversScores
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  recapText += `<p>Top Scoring Drivers:</p><ul>`;
  topDrivers.forEach(({ driver, team, points }) => {
    recapText += `<li>${driver} (${team}) - ${points} points</li>`;
  });
  recapText += `</ul></div>`;

  recapContainer.innerHTML = recapText;
}

// Load Team Page
function loadTeamPage() {
  if (!isDataLoaded) return;

  const teamSelect = document.getElementById("team-select");
  const selectedTeam = teamSelect.value;
  const teamRoster = document.querySelector("#team-roster tbody");

  if (!standingsData.teams[selectedTeam]) return;

  teamRoster.innerHTML = "";

  // Add rows for each driver
  standingsData.teams[selectedTeam].drivers.forEach(driver => {
    const driverTotalPoints = standingsData.weeks.reduce((total, week) => {
      return total + (week.standings[selectedTeam]?.drivers[driver] || 0);
    }, 0);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver}</td>
      <td>${driverTotalPoints}</td>
    `;
    teamRoster.appendChild(row);
  });

  // Add total row
  const teamTotal = standingsData.weeks.reduce((total, week) => {
    return total + (week.standings[selectedTeam]?.total || 0);
  }, 0);

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td><strong>${teamTotal}</strong></td>
  `;
  teamRoster.appendChild(totalRow);
}

// Initialize
function init() {
  if (!isDataLoaded) return;

  populateWeekDropdown();
  populateTeamDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
  generateWeeklyRecap();
  openTab('weekly');
}

// Helper functions (populateWeekDropdown, populateTeamDropdown, openTab, etc.)
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  weekSelect.innerHTML = "";

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week} - ${week.track}`;
    weekSelect.appendChild(option);
  });

  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });
}

function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  Object.keys(standingsData.teams).forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });

  teamSelect.addEventListener("change", loadTeamPage);
}

function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach(tab => tab.style.display = "none");
  tablinks.forEach(link => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  if (tabName === "teams") {
    loadTeamPage();
  }
}

window.onload = fetchDataFromGoogleSheets;
