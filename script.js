const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27";
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };
let driversData = []; // Store driver data
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

    const totalsData = await totalsResponse.json();
    const driversDataResponse = await driversResponse.json();

    console.log("Totals Data:", totalsData.values); // Debugging
    console.log("Drivers Data:", driversDataResponse.values); // Debugging

    // Process both datasets
    processTotalsData(totalsData.values);
    processDriversData(driversDataResponse.values);

    // Mark data as loaded
    isDataLoaded = true;

    // Initialize the UI after data is fully processed
    init();
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

// Process team totals data (opposite structure)
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
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1]);
    });
  });

  console.log("Processed Totals Data:", standingsData); // Debugging
}

// Process driver data
function processDriversData(data) {
  const headerRow = data[0]; // Track names are in the header row
  const driverRows = data.slice(1); // Skip the header row

  let currentTeam = null;
  const teams = {};

  driverRows.forEach((row) => {
    const driver = row[0]; // Driver name is in the first column
    const team = row[1]; // Team name is in the second column

    if (driver && team) {
      // New team detected
      if (!teams[team]) {
        teams[team] = {
          drivers: [],
          totals: new Array(headerRow.length - 2).fill(0), // Initialize totals for each track
        };
      }
      currentTeam = team;

      // Add driver to the team
      const points = row.slice(2).map((points) => parseInt(points));
      teams[team].drivers.push({ driver, points });

      // Update team totals
      points.forEach((points, index) => {
        teams[team].totals[index] += points;
      });
    } else if (driver === "Total") {
      // Handle total row (optional)
      console.log(`Total for ${currentTeam}: ${row.slice(2).join(", ")}`);
    }
  });

  // Store team rosters
  standingsData.teams = teams;
  console.log("Processed Drivers Data:", standingsData.teams); // Debugging
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    for (const [team, points] of Object.entries(week.standings)) {
      if (!totalPoints[team]) totalPoints[team] = 0;
      totalPoints[team] += points;
    }
  });

  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${team}</td>
      <td>${points}</td>
    `;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

// Highlight Leader
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
  const selectedWeek = weekSelect.value;
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week == selectedWeek);

  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${team}</td>
        <td>${points}</td>
      `;
      weeklyTable.appendChild(row);
    });
  }
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  weekSelect.innerHTML = "";

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week} - ${week.track}`;
    weekSelect.appendChild(option);
  });
}

// Load Team Pages
function loadTeamPage() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  const teamSelect = document.getElementById("team-select");
  const trackSelect = document.getElementById("track-select");
  const teamRoster = document.querySelector("#team-roster tbody");

  if (!teamSelect || !trackSelect || !teamRoster) {
    console.error("Missing team dropdown, track dropdown, or team roster element.");
    return;
  }

  const selectedTeam = teamSelect.value;
  const selectedTrack = trackSelect.value;

  console.log("Selected Team:", selectedTeam);
  console.log("Selected Track:", selectedTrack);

  // Ensure selected team exists
  if (!standingsData.teams[selectedTeam]) {
    console.warn("No data found for selected team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='2'>No data found for this team.</td></tr>";
    return;
  }

  const teamData = standingsData.teams[selectedTeam];

  if (!teamData.drivers || teamData.drivers.length === 0) {
    console.warn("No drivers found for team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='2'>No drivers found for this team.</td></tr>";
    return;
  }

  console.log("Team Data:", teamData);

  // Populate track dropdown (only show tracks with valid data)
  trackSelect.innerHTML = "";
  standingsData.weeks.forEach((week, index) => {
    // Check if the team has valid data for this track
    if (teamData.totals[index] !== undefined && teamData.totals[index] > 0) {
      const option = document.createElement("option");
      option.value = index; // Use track index as value
      option.textContent = week.track;
      trackSelect.appendChild(option);
    }
  });

  // If no tracks have data, show a message
  if (trackSelect.options.length === 0) {
    teamRoster.innerHTML = "<tr><td colspan='2'>No data available for any track.</td></tr>";
    return;
  }

  // Set the default track selection to the first available track
  if (trackSelect.options.length > 0) {
    trackSelect.value = trackSelect.options[0].value;
  }

  // Load driver points for the selected track
  const trackIndex = parseInt(selectedTrack);
  teamRoster.innerHTML = teamData.drivers
    .map(
      (driver) => `
    <tr>
      <td>${driver.driver}</td>
      <td>${driver.points[trackIndex] || 0}</td> <!-- Default to 0 if undefined -->
    </tr>
  `
    )
    .join("");

  // Add total row
  teamRoster.innerHTML += `
    <tr class="total-row">
      <td><strong>Total</strong></td>
      <td><strong>${teamData.totals[trackIndex] || 0}</strong></td> <!-- Default to 0 if undefined -->
    </tr>
  `;
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  const teams = Object.keys(standingsData.teams);
  console.log("Teams:", teams); // Debugging

  if (teams.length > 0) {
    teams.forEach((team, index) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      teamSelect.appendChild(option);

      // Set the first team as the default selection
      if (index === 0) {
        teamSelect.value = team;
      }
    });

    // Call loadTeamPage after populating the dropdown
    loadTeamPage();
  }
}

// Open Tabs
function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach((tab) => (tab.style.display = "none"));
  tablinks.forEach((link) => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage(); // Call loadTeamPage after populating the team dropdown
  }
}

// Initialize the Page
function init() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  populateWeekDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
}

// Fetch Data and Initialize
fetchDataFromGoogleSheets();
