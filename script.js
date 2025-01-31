const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27"; // Range for team totals (adjust as needed)
const driversRange = "Drivers!A1:AB43"; // Range for driver data (adjust as needed)

let standingsData = { weeks: [], teams: {} };
let driversData = []; // Store driver data

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    // Fetch team totals
    const totalsResponse = await fetch(totalsUrl);
    const totalsData = await totalsResponse.json();
    processTotalsData(totalsData.values);

    // Fetch driver data
    const driversResponse = await fetch(driversUrl);
    const driversDataResponse = await driversResponse.json();
    processDriversData(driversDataResponse.values);
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
    standings: {}
  }));

  headerRow.slice(1).forEach((team, teamIndex) => {
    trackRows.forEach((row, trackIndex) => {
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1]);
    });
  });

  init();
}

// Process driver data
function processDriversData(data) {
  const headerRow = data[0]; // Track names are in the header row
  const driverRows = data.slice(1); // Skip the header row

  driversData = driverRows.map(row => ({
    driver: row[0], // Driver name is in the first column
    team: row[1],   // Team name is in the second column
    points: row.slice(2).map(points => parseInt(points)) // Points for each track
  }));

  // Group drivers by team
  const teams = {};
  driversData.forEach(driver => {
    if (!teams[driver.team]) {
      teams[driver.team] = [];
    }
    teams[driver.team].push(driver);
  });

  // Store team rosters
  standingsData.teams = teams;
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
  const teamSelect = document.getElementById("team-select");
  const selectedTeam = teamSelect.value;
  const teamDetails = document.getElementById("team-details");
  teamDetails.innerHTML = "";

  const teamDrivers = standingsData.teams[selectedTeam];

  if (teamDrivers && teamDrivers.length > 0) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Driver</th>
          ${standingsData.weeks.map(week => `<th>${week.track}</th>`).join("")}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${teamDrivers.map(driver => `
          <tr>
            <td>${driver.driver}</td>
            ${driver.points.map(points => `<td>${points}</td>`).join("")}
            <td>${driver.points.reduce((sum, points) => sum + points, 0)}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    teamDetails.appendChild(table);
  } else {
    teamDetails.innerHTML = "<p>No drivers found for this team.</p>";
  }
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  const teams = Object.keys(standingsData.teams);
  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });
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
    loadTeamPage();
  }
}

// Initialize the Page
function init() {
  populateWeekDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
}

// Fetch Data and Initialize
fetchDataFromGoogleSheets();
