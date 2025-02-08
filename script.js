const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27";
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };
let isDataLoaded = false; // Track if data is fully loaded

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    // Fetch both team totals and driver data simultaneously
    const [totalsResponse, driversResponse] = await Promise.all([
      fetch(totalsUrl),
      fetch(driversUrl),
    ]);

    // Check if responses are OK
    if (!totalsResponse.ok || !driversResponse.ok) {
      throw new Error("One of the fetch requests failed.");
    }

    const totalsData = await totalsResponse.json();
    const driversDataResponse = await driversResponse.json();

    console.log("Totals Data:", totalsData.values);
    console.log("Drivers Data:", driversDataResponse.values);

    // Process both datasets
    processTotalsData(totalsData.values);
    processDriversData(driversDataResponse.values);

    // Mark data as loaded and initialize the UI
    isDataLoaded = true;
    init();
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

// Process team totals data
function processTotalsData(data) {
  const headerRow = data[0]; // Team names are in the header row
  const trackRows = data.slice(1); // Skip the header row

  standingsData.weeks = trackRows.map((row, index) => ({
    week: index + 1,
    track: row[0], // Track name is in the first column
    standings: {},
  }));

  headerRow.slice(1).forEach((team, teamIndex) => {
    trackRows.forEach((row, trackIndex) => {
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1], 10);
    });
  });

  console.log("Processed Totals Data:", standingsData);
}

// Process driver data
function processDriversData(data) {
  const headerRow = data[0]; // Header row (driver, team, points, …)
  const driverRows = data.slice(1); // Skip header row

  const teams = {};

  driverRows.forEach((row) => {
    const driver = row[0]; // Driver name in first column
    const team = row[1];   // Team name in second column

    if (driver && team) {
      // Initialize team if not already present
      if (!teams[team]) {
        teams[team] = {
          drivers: [],
          totals: new Array(headerRow.length - 2).fill(0), // Totals for each track
        };
      }

      // Add driver data
      const points = row.slice(2).map((points) => parseInt(points, 10));
      const totalPoints = points.reduce((sum, point) => sum + point, 0);
      teams[team].drivers.push({ driver, points, totalPoints });

      // Update team totals per track
      points.forEach((pt, index) => {
        teams[team].totals[index] += pt;
      });
    } else if (driver === "Total") {
      console.log(`Total for ${team}: ${row.slice(2).join(", ")}`);
    }
  });

  standingsData.teams = teams;
  console.log("Processed Drivers Data:", standingsData.teams);
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) {
    console.error("Week select dropdown not found.");
    return;
  }

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week}: ${week.track}`;
    weekSelect.appendChild(option);
  });
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  if (!teamSelect) {
    console.error("Team select dropdown not found.");
    return;
  }

  // Populate the dropdown with team names
  Object.keys(standingsData.teams).forEach((team) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    for (const [team, points] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + points;
    }
  });

  // Sort teams by points descending
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    // Add trophy icon for first place
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : "";
    row.innerHTML = 
      `<td>${trophy}${team}</td>
      <td>${points}</td>`;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

// Highlight Leader in Overall Standings
function highlightLeader() {
  const overallTable = document.querySelector("#overall-standings tbody");
  const firstRow = overallTable.querySelector("tr");
  if (firstRow) {
    firstRow.classList.add("leader");
  }
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  // Find the week matching the selected week number
  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points], index) => {
      const row = document.createElement("tr");
      // Add checkered flag icon for first place if points > 0
      const flag = index === 0 && points > 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = 
        `<td>${flag}${team}</td>
        <td>${points}</td>`;
      weeklyTable.appendChild(row);
    });
  }
}

// Generate AI Recap for the Selected Week
function generateWeeklyRecap() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find(week => week.week === selectedWeek);

  if (!weekData) {
    console.warn(`No data found for week ${selectedWeek}`);
    return;
  }

  const currentStandings = weekData.standings;

  // Clear the previous recap data to avoid showing old data
  let recapHTML = "<h2>Race Recap</h2>";

  // Find the top team (winner)
  const sortedTeams = Object.entries(currentStandings).sort((a, b) => b[1] - a[1]);
  const topTeam = sortedTeams[0][0]; // Extract top team name
  const topTeamPoints = sortedTeams[0][1];
  recapHTML += `<h3>Winning Team: ${topTeam} - ${topTeamPoints} points</h3>`;

  // Get the drivers for the top team
  const topDrivers = standingsData.teams[topTeam].drivers;
  const topDriversWithOver30 = topDrivers.filter(driver => driver.totalPoints > 30);
  let topPerformersHTML = "<h3>Top Performers:</h3>";
  if (topDriversWithOver30.length > 0) {
    topPerformersHTML += topDriversWithOver30.map(driver => {
      return `${driver.driver} with ${driver.totalPoints} points`;
    }).join('<br>');
  } else {
    topPerformersHTML += "No standout drivers with over 30 points this week.";
  }
  recapHTML += topPerformersHTML;

  // Find the last place team (worst)
  const lastPlaceTeam = sortedTeams[sortedTeams.length - 1][0]; // Extract last place team
  const lastPlacePoints = sortedTeams[sortedTeams.length - 1][1];
  recapHTML += `<h3>Last Place Team: ${lastPlaceTeam} - ${lastPlacePoints} points</h3>`;

  // Get the drivers for the last place team
  const lastPlaceDrivers = standingsData.teams[lastPlaceTeam].drivers;
  const worstDrivers = lastPlaceDrivers.filter(driver => driver.totalPoints < 6);
  let worstPerformersHTML = "<h3>Worst Performers:</h3>";
  if (worstDrivers.length > 0) {
    worstPerformersHTML += worstDrivers.map(driver => {
      return `${driver.driver} with ${driver.totalPoints} points`;
    }).join('<br>');
  } else {
    worstPerformersHTML += "No drivers had a bad week with points under 6.";
  }
  recapHTML += worstPerformersHTML;

  // Track Overall Standings Movement
  const currentOverallStandings = getOverallStandings();
  let standingsMovementHTML = "<h3>Standings Movement:</h3>";

  const previousOverallStandings = getPreviousWeekStandings(selectedWeek); // Get standings from the previous week
  const movement = detectStandingsMovement(previousOverallStandings, currentOverallStandings);
  if (movement.length > 0) {
    standingsMovementHTML += movement.join('<br>');
  } else {
    standingsMovementHTML += "No major movement in overall standings.";
  }

  recapHTML += standingsMovementHTML;

  // Update the race recap section
  document.getElementById('race-recap').innerHTML = recapHTML;
}

// Helper function to get the standings for the previous week
function getPreviousWeekStandings(currentWeek) {
  const previousWeekData = standingsData.weeks.find(week => week.week === currentWeek - 1);
  return previousWeekData ? previousWeekData.standings : {};
}

// Helper function to get current overall standings (summed across all weeks)
function getOverallStandings() {
  const totalPoints = {};
  standingsData.weeks.forEach((week) => {
    for (const [team, points] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + points;
    }
  });

  // Sort teams by total points
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);
  return sortedTeams;
}

// Load Team Page (Roster, Images, etc.)
function loadTeamPage() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  let teamSelect = document.getElementById("team-select");
  let trackSelect = document.getElementById("track-select");
  let teamRoster = document.querySelector("#team-roster tbody");
  let teamImage = document.getElementById("team-image");
  let trackImage = document.getElementById("track-image");

  if (!teamSelect || !trackSelect || !teamRoster || !teamImage || !trackImage) {
    console.error("Missing dropdowns or team roster element.");
    return;
  }

  let selectedTeam = teamSelect.value;
  let selectedTrack = trackSelect.value;

  console.log("Selected Team:", selectedTeam);
  console.log("Selected Track:", selectedTrack);

  // Display Team Image
  const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.src = teamImageUrl;

  // Display Track Image
  const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${selectedTrack.replace(/\s+/g, '_')}.jpg`;
  trackImage.src = trackImageUrl;

  // Load Team Roster
  let roster = standingsData.teams[selectedTeam].drivers;
  teamRoster.innerHTML = ""; // Clear previous roster

  roster.forEach(driver => {
    const row = document.createElement("tr");
    row.innerHTML = 
      `<td>${driver.driver}</td>
      <td>${driver.totalPoints}</td>`;
    teamRoster.appendChild(row);
  });
}

// Event Listener for Week Change
document.getElementById("week-select").addEventListener("change", function () {
  loadWeeklyStandings();
  generateWeeklyRecap();
});

// Initialize page
function init() {
  populateWeekDropdown();
  populateTeamDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
  generateWeeklyRecap();
  loadTeamPage();
}

// Call fetchData to load all the data
fetchDataFromGoogleSheets();
