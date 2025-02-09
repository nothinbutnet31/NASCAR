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
  // Assume the first row contains track names (starting from column 2)
  const headerRow = data[0];
  const positions = data.slice(1);
  
  // Reset weeks array
  standingsData.weeks = [];
  
  // For each track (column, starting from index 1), create a week entry
  headerRow.slice(1).forEach((track, trackIndex) => {
    if (!track) return;
    let raceResults = {
      track: track.trim(),
      week: trackIndex + 1,
      standings: {}  // Will hold each team's result for that track
    };

    // For each team, calculate points for this track based on driver placements
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

function processDriversData(data) {
  // In this example, we use the driver names from the initial standingsData.teams.
  // You might want to update this function if your driver data includes more info.
  // For now, we'll assume the team driver lists are already set in standingsData.teams.
  console.log("Processed Drivers Data:", standingsData.teams);
}

// ---------------------------
// UI Population Functions
// ---------------------------
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) return;
  weekSelect.innerHTML = "";
  
  // Add a default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Week";
  weekSelect.appendChild(defaultOption);
  
  let lastValidWeekIndex = 0;
  standingsData.weeks.forEach((week, index) => {
    if (week.track && week.track.trim() !== "") {
      // Check if the week has non-zero data
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

function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  if (!teamSelect) return;
  teamSelect.innerHTML = "";
  
  // Add a default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Team";
  teamSelect.appendChild(defaultOption);
  
  Object.keys(standingsData.teams).forEach((team, index) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
    if (index === 0) teamSelect.value = team;
  });
  teamSelect.addEventListener("change", loadTeamPage);
}

// ---------------------------
// Standings Display Functions
// ---------------------------
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

function highlightLeader() {
  const leaderRow = document.querySelector('.leader-row');
  if (leaderRow) {
    leaderRow.style.backgroundColor = '#f0f8ff';
    leaderRow.style.fontWeight = 'bold';
  }
}

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

  // Sort current standings by total points for the week
  const sortedTeams = Object.entries(weekData.standings).sort((a, b) => b[1].total - a[1].total);
  if (sortedTeams.length === 0) {
    recapContainer.innerHTML = "<p>No standings available for this week.</p>";
    return;
  }

  const winningTeamName = sortedTeams[0][0];
  const winningTeamPoints = sortedTeams[0][1].total;
  const lastPlaceTeamName = sortedTeams[sortedTeams.length - 1][0];
  const lastPlaceTeamPoints = sortedTeams[sortedTeams.length - 1][1].total;

  let recapHTML = `<h2>Race Recap: ${weekData.track}</h2>
    <h3>Winning Team: ${winningTeamName} - ${winningTeamPoints} points</h3>`;
  
  // Top performers on winning team (drivers with over 30 points)
  let topDriverNames = [];
  if (standingsData.teams.hasOwnProperty(winningTeamName)) {
    const topDrivers = standingsData.teams[winningTeamName].drivers.filter(driver => driver.totalPoints > 30);
    topDriverNames = topDrivers.map(driver => `${driver.driver} with ${driver.totalPoints} points`);
  }
  recapHTML += `<h4>Top Performers:</h4>
    <p>${topDriverNames.length > 0 ? topDriverNames.join('<br>') : "No drivers scored over 30 points on the winning team."}</p>`;
  
  recapHTML += `<h3>Last Place Team: ${lastPlaceTeamName} - ${lastPlaceTeamPoints} points</h3>`;
  
  // Worst performers on last place team (drivers with less than 6 points)
  let worstDriverNames = [];
  if (standingsData.teams.hasOwnProperty(lastPlaceTeamName)) {
    const worstDrivers = standingsData.teams[lastPlaceTeamName].drivers.filter(driver => driver.totalPoints < 6);
    worstDriverNames = worstDrivers.map(driver => `${driver.driver} with ${driver.totalPoints} points`);
  }
  recapHTML += `<h4>Worst Performers:</h4>
    <p>${worstDriverNames.length > 0 ? worstDriverNames.join('<br>') : "No drivers had a bad week (under 6 points) on the last place team."}</p>`;

  // Overall standings movement
  const previousStandings = getPreviousWeekStandings(selectedWeek);
  const currentOverallStandings = getOverallStandings();
  const movement = detectStandingsMovement(previousStandings, currentOverallStandings);
  recapHTML += `<h4>Overall Standings Movement:</h4>
    <p>${movement.join('<br>')}</p>`;

  recapContainer.innerHTML = recapHTML;
}

function getOverallStandings() {
  const totalPoints = {};
  standingsData.weeks.forEach((week) => {
    for (const [team, data] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    }
  });
  return Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);
}

function getPreviousWeekStandings(currentWeek) {
  const previousWeekData = standingsData.weeks.find(week => week.week === currentWeek - 1);
  return previousWeekData ? previousWeekData.standings : {};
}

function detectStandingsMovement(previousStandings, currentStandings) {
  // Ensure previousStandings and currentStandings are arrays
  if (!Array.isArray(previousStandings)) {
    previousStandings = Object.entries(previousStandings);
  }
  if (!Array.isArray(currentStandings)) {
    currentStandings = Object.entries(currentStandings);
  }
  let movement = [];
  let previousRanks = {};
  previousStandings.forEach((entry, index) => {
    previousRanks[entry[0]] = index + 1;
  });
  currentStandings.forEach((entry, index) => {
    const team = entry[0];
    const currentRank = index + 1;
    const previousRank = previousRanks[team] || currentRank;
    const rankChange = previousRank - currentRank;
    if (rankChange > 0) {
      movement.push(`${team} moved up ${rankChange} spots.`);
    } else if (rankChange < 0) {
      movement.push(`${team} dropped ${Math.abs(rankChange)} spots.`);
    }
  });
  return movement.length > 0 ? movement : ["No major changes in overall standings."];
}

// ---------------------------
// Team Page Functions
// ---------------------------
function loadTeamPage() {
  const teamSelect = document.getElementById("team-select");
  const trackSelect = document.getElementById("track-select");
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");
  const teamStatsContainer = document.getElementById("team-stats");

  if (!teamSelect || !trackSelect || !teamRoster || !teamImage || !teamStatsContainer) return;

  let selectedTeam = teamSelect.value;
  let selectedTrack = trackSelect.value;

  if (!standingsData.teams[selectedTeam]) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No data found for this team.</td></tr>";
    return;
  }

  const teamData = standingsData.teams[selectedTeam];

  // Update team image
  teamImage.src = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.alt = `${selectedTeam} Logo`;
  teamImage.onerror = function () {
    this.src = "https://via.placeholder.com/100";
  };

  // Populate track dropdown for this team
  trackSelect.innerHTML = "";
  standingsData.weeks.forEach((week, index) => {
    if (teamData.totals[index] !== undefined && teamData.totals[index] > 0) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = week.track;
      trackSelect.appendChild(option);
    }
  });
  if (trackSelect.options.length === 0) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No data available for any track.</td></tr>";
    return;
  }
  if (!selectedTrack) {
    trackSelect.selectedIndex = 0;
    selectedTrack = trackSelect.value;
  }
  loadTeamRoster(selectedTeam, selectedTrack);
}

function loadTeamRoster(teamName, trackIndex) {
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamData = standingsData.teams[teamName];
  const trackData = standingsData.weeks[trackIndex];

  if (!trackData) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No track data available.</td></tr>";
    return;
  }

  teamRoster.innerHTML = "";
  let teamTotalTrackPoints = 0;
  teamData.drivers.forEach((driver) => {
    const trackPoints = driver.points[trackIndex] || 0;
    teamTotalTrackPoints += trackPoints;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver.driver}</td>
      <td class="points-cell">${trackPoints}</td>
      <td class="points-cell">${driver.totalPoints}</td>
    `;
    teamRoster.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.className = "total-row";
  totalRow.innerHTML = `
    <td><strong>Total Team Points (Track)</strong></td>
    <td class="points-cell"><strong>${teamTotalTrackPoints}</strong></td>
    <td></td>
  `;
  teamRoster.appendChild(totalRow);

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

// ---------------------------
// Navigation Functions
// ---------------------------
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

// Calculate overall team position (across all weeks)
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

// ---------------------------
// Standings Movement Functions
// ---------------------------
function getOverallStandings() {
  const totalPoints = {};
  standingsData.weeks.forEach((week) => {
    for (const [team, data] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    }
  });
  return Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);
}

function getPreviousWeekStandings(currentWeek) {
  const previousWeekData = standingsData.weeks.find(week => week.week === currentWeek - 1);
  return previousWeekData ? previousWeekData.standings : {};
}

function detectStandingsMovement(previousStandings, currentStandings) {
  if (!Array.isArray(previousStandings)) {
    previousStandings = Object.entries(previousStandings);
  }
  if (!Array.isArray(currentStandings)) {
    currentStandings = Object.entries(currentStandings);
  }
  let movement = [];
  let previousRanks = {};
  previousStandings.forEach((entry, index) => {
    previousRanks[entry[0]] = index + 1;
  });
  currentStandings.forEach((entry, index) => {
    const team = entry[0];
    const currentRank = index + 1;
    const previousRank = previousRanks[team] || currentRank;
    const rankChange = previousRank - currentRank;
    if (rankChange > 0) {
      movement.push(`${team} moved up ${rankChange} spots.`);
    } else if (rankChange < 0) {
      movement.push(`${team} dropped ${Math.abs(rankChange)} spots.`);
    }
  });
  return movement.length > 0 ? movement : ["No major changes in overall standings."];
}

// ---------------------------
// App Initialization
// ---------------------------
function initializeApp() {
  if (!isDataLoaded) return;
  
  populateWeekDropdown();
  populateTeamDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
  generateWeeklyRecap();

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
  
  openTab("weekly-standings");
  const defaultTab = document.querySelector(".tablink");
  if (defaultTab) {
    defaultTab.click();
  }
}

// ---------------------------
// Start the App
// ---------------------------
window.onload = () => {
  fetchDataFromGoogleSheets();
};
