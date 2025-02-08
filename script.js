const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27";
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };
let isDataLoaded = false;

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    const [totalsResponse, driversResponse] = await Promise.all([
      fetch(totalsUrl),
      fetch(driversUrl),
    ]);

    if (!totalsResponse.ok || !driversResponse.ok) {
      throw new Error("One of the fetch requests failed.");
    }

    const totalsData = await totalsResponse.json();
    const driversDataResponse = await driversResponse.json();

    processTotalsData(totalsData.values);
    processDriversData(driversDataResponse.values);

    isDataLoaded = true;
    init();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Process team totals data
function processTotalsData(data) {
  const headerRow = data[0];
  const trackRows = data.slice(1);

  standingsData.weeks = trackRows.map((row, index) => ({
    week: index + 1,
    track: row[0],
    standings: {},
  }));

  headerRow.slice(1).forEach((team, teamIndex) => {
    trackRows.forEach((row, trackIndex) => {
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1], 10) || 0;
    });
  });
}

// Process driver data
function processDriversData(data) {
  const driverRows = data.slice(1);
  standingsData.teams = {};

  driverRows.forEach((row) => {
    const driver = row[0];
    const team = row[1];

    if (driver && team) {
      if (!standingsData.teams[team]) {
        standingsData.teams[team] = { drivers: [], totals: [] };
      }

      const points = row.slice(2).map((p) => parseInt(p, 10) || 0);
      const totalPoints = points.reduce((sum, p) => sum + p, 0);

      standingsData.teams[team].drivers.push({ driver, points, totalPoints });

      points.forEach((pt, i) => {
        standingsData.teams[team].totals[i] = (standingsData.teams[team].totals[i] || 0) + pt;
      });
    }
  });
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  weekSelect.innerHTML = "";
  
  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week}: ${week.track}`;
    weekSelect.appendChild(option);
  });

  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  Object.keys(standingsData.teams).forEach((team) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });

  teamSelect.addEventListener("change", loadTeamPage);
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

  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${index === 0 ? '<i class="fas fa-trophy"></i> ' : ""}${team}</td><td>${points}</td>`;
    overallTable.appendChild(row);
  });
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week === selectedWeek);
  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points], index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index === 0 && points > 0 ? '<i class="fas fa-flag-checkered"></i> ' : ""}${team}</td><td>${points}</td>`;
      weeklyTable.appendChild(row);
    });
  }
}

// Load Team Page
function loadTeamPage() {
  const teamSelect = document.getElementById("team-select");
  const teamRoster = document.querySelector("#team-roster tbody");
  teamRoster.innerHTML = "";

  const selectedTeam = teamSelect.value;
  const teamData = standingsData.teams[selectedTeam];

  if (!teamData) {
    teamRoster.innerHTML = "<tr><td colspan='2'>No data for this team.</td></tr>";
    return;
  }

  teamData.drivers.forEach((driver) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${driver.driver}</td><td>${driver.totalPoints}</td>`;
    teamRoster.appendChild(row);
  });
}

// Initialize the Page
function init() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  populateWeekDropdown();
  populateTeamDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
  generateWeeklyRecap();
}

// Fetch data when the window loads
window.onload = () => {
  fetchDataFromGoogleSheets();
};
