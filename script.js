// Constants and Initial Data
const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Drivers!A1:AA45";  // Adjust range as needed

// Scoring system for additional features (if needed)
const scoringSystem = {
  "1st": 40, "2nd": 35, "3rd": 34, "4th": 33, "5th": 32,
  "6th": 31, "7th": 30, "8th": 29, "9th": 28, "10th": 27,
  "11th": 26, "12th": 25, "13th": 24, "14th": 23, "15th": 22,
  "16th": 21, "17th": 20, "18th": 19, "19th": 18, "20th": 17,
  "21st": 16, "22nd": 15, "23rd": 14, "24th": 13, "25th": 12,
  "26th": 11, "27th": 10, "28th": 9,  "29th": 8,  "30th": 7,
  "31st": 6,  "32nd": 5,  "33rd": 4,  "34th": 3,  "35th": 2,
  "36th": 1,  "37th": 1,  "38th": 1,  "39th": 1,  "40th": 1,
  "Fastest Lap": 1, "Stage 1 Winner": 10, "Stage 2 Winner": 10, "Pole Winner": 5
};

// Standings Data: weeks and teams (teams with driver rosters)
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

// -----------------------------------------------------------------------------
// Core Data Loading Functions
// -----------------------------------------------------------------------------

async function fetchDataFromGoogleSheets() {
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;
  try {
    const response = await fetch(driversUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }
    const data = await response.json();
    if (data.values && data.values.length > 0) {
      processRaceData(data.values);
      isDataLoaded = true;
      initializeApp();
    } else {
      throw new Error("No data received from Google Sheets");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    document.body.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
  }
}

function processRaceData(data) {
  const headerRow = data[0];
  const positions = data.slice(1);
  
  // Reset weeks array
  standingsData.weeks = [];
  
  // Each column (except the first) is a track; use headerRow slice (from index 1)
  headerRow.slice(1).forEach((track, trackIndex) => {
    if (!track) return;
    let raceResults = {
      track: track.trim(),
      week: trackIndex + 1,
      standings: {}  // Will hold each team's result for that track
    };

    // For each team in standingsData.teams, calculate points for this track.
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

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

// Calculate overall team position (summing across all weeks)
function calculateTeamPosition(teamName) {
  const totalPoints = {};
  standingsData.weeks.forEach((week) => {
    for (const [team, data] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    }
  });
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]).map(([team]) => team);
  return sortedTeams.indexOf(teamName) + 1;
}

// Highlight the leader in standings tables
function highlightLeader() {
  const leaderRow = document.querySelector('.leader-row');
  if (leaderRow) {
    leaderRow.style.backgroundColor = '#f0f8ff';
    leaderRow.style.fontWeight = 'bold';
  }
}

// -----------------------------------------------------------------------------
// Main Feature Functions
// -----------------------------------------------------------------------------

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  if (!overallTable) return;
  overallTable.innerHTML = "";
  const totalPoints = {};
  standingsData.weeks.forEach((week) => {
    for (const [team, data] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    }
  });
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);
  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    row.className = index === 0 ? 'leader-row' : '';
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : "";
    row.innerHTML = `<td>${trophy}${team}</td><td>${points}</td>`;
    overallTable.appendChild(row);
  });
  highlightLeader();
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  if (!weeklyTable) return;
  weeklyTable.innerHTML = "";
  const weekData = standingsData.weeks.find(week => week.week === selectedWeek);
  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1].total - a[1].total);
    sortedStandings.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      row.className = index === 0 ? 'leader-row' : '';
      const flag = index === 0 && data.total > 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = `<td>${flag}${team}</td><td>${data.total}</td>`;
      weeklyTable.appendChild(row);
    });
  }
  generateWeeklyRecap();
}

// Generate Weekly Recap
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

  let recapHTML = `<h2>Race Recap: ${weekData.track}</h2>`;
  const sortedTeams = Object.entries(weekData.standings).sort((a, b) => b[1].total - a[1].total);
  if (sortedTeams.length > 0) {
    recapHTML += `<h3>Winning Team: ${sortedTeams[0][0]} - ${sortedTeams[0][1].total} points</h3>`;
  }
  recapContainer.innerHTML = recapHTML;
}

// Load Team Page
function loadTeamPage() {
  const teamSelect = document.getElementById("team-select");
  const trackSelect = document.getElementById("track-select");
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");
  const teamStatsContainer = document.getElementById("team-stats");

  if (!teamSelect || !trackSelect || !teamRoster || !teamImage || !teamStatsContainer) return;

  const selectedTeam = teamSelect.value;
  const selectedTrack = trackSelect.value;

  if (!standingsData.teams[selectedTeam]) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No data found for this team.</td></tr>";
    return;
  }

  // Update team image
  const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.src = teamImageUrl;
  teamImage.alt = `${selectedTeam} Logo`;
  teamImage.onerror = function () {
    this.src = "https://via.placeholder.com/100";
  };

  // Populate track dropdown for this team (only tracks with data)
  trackSelect.innerHTML = "";
  let lastValidTrackIndex = 0;
  standingsData.weeks.forEach((week, index) => {
    if (week.standings[selectedTeam]?.total > 0) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = week.track;
      trackSelect.appendChild(option);
      lastValidTrackIndex = index;
    }
  });

  // Set the default selected option to the most recent non-zero track
  trackSelect.value = lastValidTrackIndex;

  // Load team roster for the selected track
  loadTeamRoster(selectedTeam, lastValidTrackIndex);
}

// Load Team Roster
function loadTeamRoster(teamName, trackIndex) {
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamData = standingsData.teams[teamName];
  const trackData = standingsData.weeks[trackIndex];

  if (!trackData) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No track data available.</td></tr>";
    return;
  }

  // Clear roster table and calculate totals
  teamRoster.innerHTML = "";
  let teamTotalTrackPoints = 0;

  teamData.drivers.forEach((driver) => {
    const trackPoints = trackData.standings[teamName]?.drivers[driver] || 0;
    teamTotalTrackPoints += trackPoints;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver}</td>
      <td class="points-cell">${trackPoints}</td>
    `;
    teamRoster.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.className = "total-row";
  totalRow.innerHTML = `
    <td><strong>Total Team Points (Track)</strong></td>
    <td class="points-cell"><strong>${teamTotalTrackPoints}</strong></td>
  `;
  teamRoster.appendChild(totalRow);

  // Update team statistics
  const teamPosition = calculateTeamPosition(teamName);
  const overallStandings = getOverallStandings();
  const teamOverallPoints = overallStandings.find(([team]) => team === teamName)?.[1] || 0;
  const raceCount = standingsData.weeks.length;
  const averagePoints = (teamOverallPoints / raceCount).toFixed(1);

  teamStatsContainer.innerHTML = `
    <h3>Team Statistics</h3>
    <p>Position: ${teamPosition}</p>
    <p>Total Points (Season): ${teamOverallPoints}</p>
    <p>Average Points per Race: ${averagePoints}</p>
  `;
}

// Open Tabs
function openTab(tabName) {
  document.querySelectorAll(".tabcontent").forEach(tab => tab.style.display = "none");
  document.querySelectorAll(".tablink").forEach(link => link.classList.remove("active"));

  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }
  const selectedLink = document.querySelector(`[onclick="openTab('${tabName}')"]`);
  if (selectedLink) {
    selectedLink.classList.add("active");
  }

  if (tabName === "weekly-standings") {
    loadWeeklyStandings();
  } else if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage();
  }
}

// Initialize the App
function initializeApp() {
  if (!isDataLoaded) return;
  
  populateWeekDropdown();
  populateTeamDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
  generateWeeklyRecap();

  // Set up event listeners for dropdowns
  const weekSelect = document.getElementById("week-select");
  if (weekSelect) {
    weekSelect.addEventListener("change", () => {
      loadWeeklyStandings();
      generateWeeklyRecap();
    });
  }
  const teamSelect = document.getElementById("team-select");
  if (teamSelect) {
    teamSelect.addEventListener("change", loadTeamPage);
  }
  const trackSelect = document.getElementById("track-select");
  if (trackSelect) {
    trackSelect.addEventListener("change", loadTeamPage);
  }
  
  openTab("weekly-standings"); // Open the Weekly Standings tab by default
}

// Start the App by fetching data from Google Sheets when window loads
window.onload = () => {
  fetchDataFromGoogleSheets();
};
