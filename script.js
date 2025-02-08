const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27";
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };
let isDataLoaded = false;

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  try {
    const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
    const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

    const [totalsResponse, driversResponse] = await Promise.all([
      fetch(totalsUrl),
      fetch(driversUrl),
    ]);

    if (!totalsResponse.ok || !driversResponse.ok) {
      throw new Error("Failed to fetch data.");
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
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1], 10);
    });
  });
}

// Process driver data
function processDriversData(data) {
  const headerRow = data[0];
  const driverRows = data.slice(1);
  const teams = {};

  driverRows.forEach((row) => {
    const driver = row[0];
    const team = row[1];

    if (driver && team) {
      if (!teams[team]) {
        teams[team] = { drivers: [], totals: new Array(headerRow.length - 2).fill(0) };
      }

      const points = row.slice(2).map((points) => parseInt(points, 10));
      const totalPoints = points.reduce((sum, point) => sum + point, 0);
      teams[team].drivers.push({ driver, points, totalPoints });

      points.forEach((pt, index) => {
        teams[team].totals[index] += pt;
      });
    }
  });

  standingsData.teams = teams;
}

// Populate dropdowns
function populateDropdown(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = options.map(option => `<option value="${option}">${option}</option>`).join("");
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = standingsData.weeks.reduce((acc, week) => {
    Object.entries(week.standings).forEach(([team, points]) => {
      acc[team] = (acc[team] || 0) + points;
    });
    return acc;
  }, {});

  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : "";
    overallTable.innerHTML += `<tr><td>${trophy}${team}</td><td>${points}</td></tr>`;
  });
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find(week => week.week === selectedWeekNumber);
  if (!weekData) return;

  Object.entries(weekData.standings)
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, points], index) => {
      const flag = index === 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      weeklyTable.innerHTML += `<tr><td>${flag}${team}</td><td>${points}</td></tr>`;
    });
}

// Generate Weekly Recap
function generateWeeklyRecap() {
  if (!isDataLoaded) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find(week => week.week === selectedWeek);
  if (!weekData) return;

  const sortedTeams = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);
  const topTeam = sortedTeams[0][0];
  const lastPlaceTeam = sortedTeams[sortedTeams.length - 1][0];

  let recapHTML = `<h2>Race Recap</h2>
    <h3>Winning Team: ${topTeam} - ${weekData.standings[topTeam]} points</h3>
    <h3>Last Place Team: ${lastPlaceTeam} - ${weekData.standings[lastPlaceTeam]} points</h3>`;

  document.getElementById('race-recap').innerHTML = recapHTML;
}

// Load Team Page
function loadTeamPage() {
  if (!isDataLoaded) return;

  let teamSelect = document.getElementById("team-select");
  let trackSelect = document.getElementById("track-select");
  let teamRoster = document.querySelector("#team-roster tbody");
  let teamImage = document.getElementById("team-image");
  let trackImage = document.getElementById("track-image");

  let selectedTeam = teamSelect.value;
  let selectedTrack = trackSelect.value;

  if (!standingsData.teams[selectedTeam]) return;

  const teamData = standingsData.teams[selectedTeam];

  teamImage.src = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.onerror = function () { this.src = "https://via.placeholder.com/100"; };

  trackImage.src = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${selectedTrack.replace(/\s+/g, '_')}.png`;
  trackImage.onerror = function () { this.src = "https://via.placeholder.com/200"; };

  teamRoster.innerHTML = "";
  teamData.drivers.forEach((driver) => {
    teamRoster.innerHTML += `<tr><td>${driver.driver}</td><td>${driver.points[standingsData.weeks.findIndex(week => week.track === selectedTrack)]}</td></tr>`;
  });
}

// Open Tabs
function openTab(tabName) {
  document.querySelectorAll(".tabcontent").forEach(tab => tab.style.display = "none");
  document.querySelectorAll(".tablink").forEach(link => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  if (tabName === "teams") {
    populateDropdown("team-select", Object.keys(standingsData.teams));
  }
}

// Initialize
function init() {
  populateDropdown("week-select", standingsData.weeks.map(week => `Week ${week.week}: ${week.track}`));
  loadOverallStandings();
}

// Fetch data on page load
fetchDataFromGoogleSheets();
