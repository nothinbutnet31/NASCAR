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
    row.innerHTML = `
      <td>${trophy}${team}</td>
      <td>${points}</td>
    `;
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
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${points}</td>
      `;
      weeklyTable.appendChild(row);
    });
  }
}

// Generate AI Recap for the Selected Week
function generateRaceRecap(raceData, teamsData) {
    // Get standings and points for both current and previous week
    const previousStandings = getPreviousStandings();  // Example function to fetch previous standings
    const currentStandings = raceData.standings; // Example from raceData (this would be your fetched data)

    // Highlight standings changes
    let standingsChanges = "";
    currentStandings.forEach((team, index) => {
        const previousPosition = previousStandings.findIndex(t => t.teamName === team.teamName);
        if (previousPosition !== index) {
            standingsChanges += `${team.teamName} moved from ${previousPosition + 1} to ${index + 1}.<br>`;
        }
    });

    // Identify top performers (highest points for the week)
    const topPerformers = raceData.topPerformers.map(driver => `${driver.name}: ${driver.points} points`).join('<br>');

    // Key storylines (example, you can customize based on race data)
    const storylines = raceData.keyStorylines.join('<br>');

    // New feature: Drivers who helped the winner and hurt the loser
    const winner = currentStandings[0]; // Winner is the first team in the standings
    const loser = currentStandings[currentStandings.length - 1]; // Loser is the last team in the standings

    let helpedWinner = "";
    let hurtLoser = "";

    // Find top drivers on the winner's team (scored over 30 points)
    winner.drivers.forEach(driver => {
        if (driver.points > 30) { // Driver with over 30 points helped the team win
            helpedWinner += `${driver.name} earned ${driver.points} points, contributing to the win.<br>`;
        }
    });

    // Find worst drivers on the loser's team (scored 5 points or fewer)
    loser.drivers.forEach(driver => {
        if (driver.points <= 5) { // Driver with 5 points or less hurt the team
            hurtLoser += `${driver.name} earned only ${driver.points} points, hurting the team's position.<br>`;
        }
    });

    // Create the recap HTML
    const recapHTML = `
        <h2>Race Recap</h2>
        <h3>Standings Changes:</h3>
        <p>${standingsChanges || "No major changes this week."}</p>

        <h3>Top Performers:</h3>
        <p>${topPerformers || "No data on top performers."}</p>

        <h3>Key Storylines:</h3>
        <p>${storylines || "Nothing noteworthy this week."}</p>

        <h3>Drivers Who Helped the Winner:</h3>
        <p>${helpedWinner || "No standout drivers this week."}</p>

        <h3>Drivers Who Hurt the Loser:</h3>
        <p>${hurtLoser || "No drivers underperformed significantly this week."}</p>
    `;

    // Insert the recap into the HTML
    document.getElementById('race-recap').innerHTML = recapHTML;
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

  if (!standingsData.teams[selectedTeam]) {
    console.warn("No data found for selected team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='3'>No data found for this team.</td></tr>";
    return;
  }

  const teamData = standingsData.teams[selectedTeam];

  if (!teamData.drivers || teamData.drivers.length === 0) {
    console.warn("No drivers found for team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='3'>No drivers found for this team.</td></tr>";
    return;
  }

  // Set team image (with fallback)
  const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.src = teamImageUrl;
  teamImage.alt = `${selectedTeam} Logo`;
  teamImage.onerror = function () {
    this.src = "https://via.placeholder.com/100";
  };

  // Set track image (with fallback)
  const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${selectedTrack.replace(/\s+/g, '_')}.png`;
  trackImage.src = trackImageUrl;
  trackImage.alt = `${selectedTrack} Image`;
  trackImage.onerror = function () {
    this.src = "https://via.placeholder.com/200";
  };

  // Repopulate track dropdown (only include tracks where team data exists)
  trackSelect.innerHTML = "";
  standingsData.weeks.forEach((week, index) => {
    if (teamData.totals[index] !== undefined && teamData.totals[index] > 0) {
      const option = document.createElement("option");
      option.value = week.track;
      option.textContent = week.track;
      trackSelect.appendChild(option);
    }
  });

  if (trackSelect.options.length === 0) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No data available for any track.</td></tr>";
    return;
  }

  // Default to the first available track if no track is selected
  if (!selectedTrack) {
    trackSelect.selectedIndex = 0;
    let selectedTrack = trackSelect.value;
  }

  // Load team roster for the selected track
  loadTeamRoster(selectedTeam, selectedTrack);
}

// Load team roster for the selected team and track
function loadTeamRoster(teamName, trackName) {
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamData = standingsData.teams[teamName];
  const trackIndex = standingsData.weeks.findIndex((week) => week.track === trackName);

  if (trackIndex === -1) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No track data available.</td></tr>";
    return;
  }

  // Populate team roster with drivers' points for the selected track
  teamRoster.innerHTML = "";
  teamData.drivers.forEach((driver) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver.driver}</td>
      <td>${driver.points[trackIndex]}</td>
    `;
    teamRoster.appendChild(row);
  });
}

// Open Tabs (for switching between pages/sections)
function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach((tab) => (tab.style.display = "none"));
  tablinks.forEach((link) => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  // Load specific content based on tab
  if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage();
  }
  // Add any other tab-specific logic here (like scoring rules, etc.)
}

// Initialize the Page after data is loaded
function init() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  // Load overall standings
  loadOverallStandings();

  // Populate and initialize the week dropdown, standings, and recap
  populateWeekDropdown();
  loadWeeklyStandings();
  generateWeeklyRecap();

  // When the week selection changes, update standings and recap
  const weekSelect = document.getElementById("week-select");
  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });

  // Populate team dropdown and load the team page
  populateTeamDropdown();
  loadTeamPage();
}

// On window load, start fetching data from Google Sheets
window.onload = () => {
  fetchDataFromGoogleSheets();
};
