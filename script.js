const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27"; 
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  try {
    const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
    const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

    const [totalsResponse, driversResponse] = await Promise.all([
      fetch(totalsUrl),
      fetch(driversUrl)
    ]);

    const totalsData = await totalsResponse.json();
    const driversDataResponse = await driversResponse.json();

    if (!totalsData.values || !driversDataResponse.values) {
      throw new Error("Missing data from Google Sheets API.");
    }

    console.log("Totals Data:", totalsData.values);
    processTotalsData(totalsData.values);

    console.log("Drivers Data:", driversDataResponse.values);
    processDriversData(driversDataResponse.values);

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Process team totals data
function processTotalsData(data) {
  if (!data.length) return;

  const headerRow = data[0]; 
  const trackRows = data.slice(1); 

  standingsData.weeks = trackRows.map((row, index) => ({
    week: index + 1,
    track: row[0], 
    standings: {}
  }));

  headerRow.slice(1).forEach((team, teamIndex) => {
    trackRows.forEach((row, trackIndex) => {
      standingsData.weeks[trackIndex].standings[team] = Number(row[teamIndex + 1]) || 0;
    });
  });

  console.log("Processed Totals Data:", standingsData);
  init();
}

// Process driver data
function processDriversData(data) {
  if (!data.length) return;

  const headerRow = data[0]; 
  const driverRows = data.slice(1); 

  let teams = {};

  driverRows.forEach(row => {
    const driver = row[0]?.trim();
    const team = row[1]?.trim();

    if (driver && team) {
      if (!teams[team]) {
        teams[team] = {
          drivers: [],
          totals: new Array(headerRow.length - 2).fill(0) 
        };
      }

      const points = row.slice(2).map(points => Number(points) || 0);
      teams[team].drivers.push({ driver, points });

      points.forEach((points, index) => {
        teams[team].totals[index] += points;
      });
    }
  });

  standingsData.teams = teams;
  console.log("Processed Drivers Data:", standingsData.teams);
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  if (!overallTable) return;

  overallTable.innerHTML = "";

  let totalPoints = {};

  standingsData.weeks.forEach((week) => {
    Object.entries(week.standings).forEach(([team, points]) => {
      totalPoints[team] = (totalPoints[team] || 0) + points;
    });
  });

  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${team}</td><td>${points}</td>`;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

// Highlight Leader
function highlightLeader() {
  const overallTable = document.querySelector("#overall-standings tbody");
  const firstRow = overallTable.querySelector("tr");
  if (firstRow) firstRow.classList.add("leader");
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const weeklyTable = document.querySelector("#weekly-standings tbody");

  if (!weekSelect || !weeklyTable) return;

  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week == weekSelect.value);
  if (!weekData) return;

  const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

  sortedStandings.forEach(([team, points]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${team}</td><td>${points}</td>`;
    weeklyTable.appendChild(row);
  });
}


// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) {
    console.error("Element #week-select not found.");
    return;
  }

  weekSelect.innerHTML = "";

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week} - ${week.track}`;
    weekSelect.appendChild(option);
  });
}


// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  if (!teamSelect) return;

  teamSelect.innerHTML = "";

  Object.keys(standingsData.teams).forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });
}

// Open Tabs
function openTab(tabName) {
  document.querySelectorAll(".tabcontent").forEach(tab => tab.style.display = "none");
  document.querySelectorAll(".tablink").forEach(link => link.classList.remove("active"));

  const tab = document.getElementById(tabName);
  if (tab) tab.style.display = "block";

  const link = document.querySelector(`[onclick="openTab('${tabName}')"]`);
  if (link) link.classList.add("active");

  if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage();
  }
}

// Load Team Pages
function loadTeamPage() {
  const teamSelect = document.getElementById("team-select");
  const teamDetails = document.getElementById("team-details");

  if (!teamSelect || !teamDetails) {
    console.error("Missing team dropdown or team details element.");
    return;
  }

  const selectedTeam = teamSelect.value;
  console.log("Selected Team:", selectedTeam);

  // Ensure selected team exists
  if (!standingsData.teams[selectedTeam]) {
    console.warn("No data found for selected team:", selectedTeam);
    teamDetails.innerHTML = "<p>No data found for this team.</p>";
    return;
  }

  const teamData = standingsData.teams[selectedTeam];

  if (!teamData.drivers || teamData.drivers.length === 0) {
    teamDetails.innerHTML = "<p>No drivers found for this team.</p>";
    return;
  }

  console.log("Team Data:", teamData);

  // Build table
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
      ${teamData.drivers.map(driver => `
        <tr>
          <td>${driver.driver}</td>
          ${driver.points.map(points => `<td>${points}</td>`).join("")}
          <td>${driver.points.reduce((sum, points) => sum + points, 0)}</td>
        </tr>
      `).join("")}
      <!-- Total Row -->
      <tr class="total-row">
        <td><strong>Total</strong></td>
        ${teamData.totals.map(total => `<td><strong>${total}</strong></td>`).join("")}
        <td><strong>${teamData.totals.reduce((sum, total) => sum + total, 0)}</strong></td>
      </tr>
    </tbody>
  `;

  teamDetails.innerHTML = ""; // Clear previous content
  teamDetails.appendChild(table);
}

// Initialize the Page
function init() {
  populateWeekDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
}

// Fetch Data and Initialize After Page Load
window.onload = fetchDataFromGoogleSheets;
